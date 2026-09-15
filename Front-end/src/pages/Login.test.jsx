import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import Login from './Login';
import { AuthContext } from '../context/authContextObject';

function renderLogin(loginMock = vi.fn()) {
  return render(
    <MemoryRouter>
      <AuthContext.Provider value={{ login: loginMock }}>
        <Login />
      </AuthContext.Provider>
    </MemoryRouter>
  );
}

describe('Login', () => {
  it('muestra campos de email y contraseña', () => {
    renderLogin();
    expect(screen.getByPlaceholderText(/manager@abarroteskaty.com/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText('••••••••')).toBeInTheDocument();
  });

  it('llama a login con email y contraseña al enviar', async () => {
    const loginMock = vi.fn().mockResolvedValue({});
    renderLogin(loginMock);

    fireEvent.change(screen.getByPlaceholderText(/manager@abarroteskaty.com/i), {
      target: { value: 'admin@test.com' },
    });
    fireEvent.change(screen.getByPlaceholderText('••••••••'), {
      target: { value: 'password123' },
    });
    fireEvent.click(screen.getByRole('button', { name: /iniciar sesión/i }));

    expect(loginMock).toHaveBeenCalledWith('admin@test.com', 'password123');
  });

  it('muestra error si login falla', async () => {
    const loginMock = vi.fn().mockRejectedValue(new Error('fail'));
    renderLogin(loginMock);

    fireEvent.change(screen.getByPlaceholderText(/manager@abarroteskaty.com/i), {
      target: { value: 'bad@test.com' },
    });
    fireEvent.change(screen.getByPlaceholderText('••••••••'), {
      target: { value: 'wrong' },
    });
    fireEvent.click(screen.getByRole('button', { name: /iniciar sesión/i }));

    expect(await screen.findByText(/correo o contraseña incorrectos/i)).toBeInTheDocument();
  });
});