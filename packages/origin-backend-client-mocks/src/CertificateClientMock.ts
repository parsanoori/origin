import {
    ICertificationRequest,
    CertificationRequestUpdateData,
    ICertificateOwnership,
    CommitmentStatus,
    IOwnershipCommitmentProofWithTx,
    CertificationRequestDataMocked
} from '@energyweb/origin-backend-core';

import { ICertificateClient } from '@energyweb/origin-backend-client';

export class CertificateClientMock implements ICertificateClient {
    private requestQueue: CertificationRequestUpdateData[] = [];
    private requestStorage = new Map<number, ICertificationRequest>();
    private certificateStorage = new Map<number, ICertificateOwnership>();

    public async queueCertificationRequestData(
        data: CertificationRequestUpdateData
    ): Promise<boolean> {
        this.requestQueue.push(data);

        return true;
    }

    public async getCertificationRequest(
        id: number
    ): Promise<ICertificationRequest> {
        return this.requestStorage.get(id);
    }

    public async getAllCertificationRequests(): Promise<ICertificationRequest[]> {
        return [...this.requestStorage.values()];
    }

    public mockBlockchainData(
        id: number,
        reqData: Partial<CertificationRequestDataMocked>
    ) {
        const certificateRequest = this.requestStorage.get(id);

        const queuedData = this.requestQueue.find(data => 
            data.deviceId === reqData.deviceId 
            && data.fromTime === reqData.fromTime 
            && data.toTime === reqData.toTime
        );

        if (queuedData) {
            const index = this.requestQueue.indexOf(queuedData);
            if (index > -1) {
                this.requestQueue.splice(index, 1);
            }
        }

        this.requestStorage.set(id, {
            id,
            ...certificateRequest,
            ...reqData,
            ...queuedData
        });
    }

    public async getOwnershipCommitment(
        certificateId: number
    ): Promise<IOwnershipCommitmentProofWithTx> {
        const certificate = this.certificateStorage.get(certificateId);

        if (!certificate?.currentOwnershipCommitment) {
            throw new Error(`getOwnershipCommitment(): doesn't exist`);
        }

        return certificate.currentOwnershipCommitment;
    }

    public async getPendingOwnershipCommitment(
        certificateId: number
    ): Promise<IOwnershipCommitmentProofWithTx> {
        const certificate = this.certificateStorage.get(certificateId);

        if (!certificate?.pendingOwnershipCommitment) {
            throw new Error(`getPendingOwnershipCommitment(): doesn't exist`);
        }

        return certificate.pendingOwnershipCommitment;
    }

    public async addOwnershipCommitment(
        certificateId: number,
        proof: IOwnershipCommitmentProofWithTx
    ): Promise<CommitmentStatus> {
        const certificate = this.certificateStorage.get(certificateId);

        if (!certificate?.currentOwnershipCommitment) {
            this.certificateStorage.set(certificateId, {
                id: certificateId,
                originalRequestor: '',
                currentOwnershipCommitment: proof,
                pendingOwnershipCommitment: null,
                ownershipHistory: []
            });

            return CommitmentStatus.CURRENT;
        }
        if (certificate.currentOwnershipCommitment && !certificate.pendingOwnershipCommitment) {
            certificate.pendingOwnershipCommitment = proof;

            this.certificateStorage.set(certificateId, certificate);
            return CommitmentStatus.PENDING;
        }

        return CommitmentStatus.REJECTED;
    }

    public async approvePendingOwnershipCommitment(
        certificateId: number
    ): Promise<IOwnershipCommitmentProofWithTx> {
        const certificate = this.certificateStorage.get(certificateId);

        if (!certificate?.pendingOwnershipCommitment) {
            throw new Error(`approvePendingOwnershipCommitment(): Doesn't exist`);
        }

        certificate.ownershipHistory.push(certificate.currentOwnershipCommitment);
        certificate.currentOwnershipCommitment = certificate.pendingOwnershipCommitment;
        certificate.pendingOwnershipCommitment = null;

        this.certificateStorage.set(certificateId, certificate);

        return certificate.currentOwnershipCommitment;
    }
}
