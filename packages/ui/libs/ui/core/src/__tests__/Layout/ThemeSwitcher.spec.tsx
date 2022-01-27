import React from 'react';
import { composeStories } from '@storybook/testing-react';
import { render, fireEvent, act, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';

import * as stories from '../../components/layout/ThemeSwitcher/ThemeSwitcher.stories';
import { ThemeSwitcherProps } from '../../components/layout/ThemeSwitcher/ThemeSwitcher';

const { Default, Controlled } = composeStories(stories);

describe('ThemeSwitcher', () => {
  it('should render default ThemeSwitcher', () => {
    const { baseElement } = render(
      <Default {...(Default.args as ThemeSwitcherProps)} />
    );
    expect(baseElement).toBeInTheDocument();
    expect(baseElement.querySelector('.MuiSwitch-root')).toBeInTheDocument();
    expect(baseElement.querySelector('.MuiSwitch-input')).toBeInTheDocument();
  });

  it('should render controlled ThemeSwitcher', async () => {
    const { baseElement } = render(
      <Controlled {...(Controlled.args as ThemeSwitcherProps)} />
    );
    await act(() => {
      fireEvent.click(baseElement.querySelector('.MuiSwitch-input'));
    });

    expect(baseElement.querySelector('.Mui-checked')).toBeInTheDocument();
  });
});
