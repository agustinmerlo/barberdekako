import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './Register.css';

// Íconos Fluent UI (Microsoft Edge)
import {
    Person24Regular,
    Mail24Regular,
    LockClosed24Regular
} from "@fluentui/react-icons";

function Register() {
    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        username: '',
        email: '',
        password: '',
        password2: '',
    });

    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);

    const [passwordValidations, setPasswordValidations] = useState({
        hasCaracter: false,
        hasUppercase: false,
        hasNumber: false,
        hasSymbol: false,
    });

    // VALIDACIÓN DINÁMICA DE CONTRASEÑA
    useEffect(() => {
        setPasswordValidations({
            hasCaracter: formData.password.length >= 6,
            hasUppercase: /[A-Z]/.test(formData.password),
            hasNumber: /\d/.test(formData.password),
            hasSymbol: /[!@#$%^&*(),.?":{}|<>]/.test(formData.password),
        });
    }, [formData.password]);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);

        if (formData.password !== formData.password2) {
            setError("Las contraseñas no coinciden.");
            return;
        }

        // VALIDAR TODOS LOS REQUISITOS
        if (
            !passwordValidations.hasCaracter ||
            !passwordValidations.hasUppercase ||
            !passwordValidations.hasNumber ||
            !passwordValidations.hasSymbol
        ) {
            setError("La contraseña no cumple todos los requisitos.");
            return;
        }

        setLoading(true);
        try {
            const response = await fetch("http://127.0.0.1:8000/api/usuarios/register/", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData)
            });

            const data = await response.json();

            if (!response.ok) {
                setError(data.error || JSON.stringify(data));
            } else {
                console.log("Registro exitoso:", data);
                if (data.token) localStorage.setItem("authToken", data.token);
                navigate("/"); 
            }
        } catch (err) {
            console.error(err);
            setError("Error de registro. Intenta más tarde.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="register-container">
            <div className="background-overlay"></div>
            <div className="card">
                <div className="logo-container">
                    <img src="/assets/logo.png" alt="Logo Clase V" className="logo-image" />
                </div>

                <h2>Crea una cuenta</h2>
                <p className="subtitle">Es rápido y fácil.</p>

                <form className="form" onSubmit={handleSubmit}>

                    {/* Usuario */}
                    <div className="input-group">
                        <Person24Regular className="input-icon" />
                        <input
                            type="text"
                            name="username"
                            placeholder="Nombre de usuario"
                            value={formData.username}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    {/* Correo */}
                    <div className="input-group">
                        <Mail24Regular className="input-icon" />
                        <input
                            type="email"
                            name="email"
                            placeholder="Correo electrónico"
                            value={formData.email}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    {/* Contraseña */}
                    <div className="input-group">
                        <LockClosed24Regular className="input-icon" />
                        <input
                            type="password"
                            name="password"
                            placeholder="Contraseña"
                            value={formData.password}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    {/* Confirmar contraseña */}
                    <div className="input-group">
                        <LockClosed24Regular className="input-icon" />
                        <input
                            type="password"
                            name="password2"
                            placeholder="Confirma contraseña"
                            value={formData.password2}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    {/* Error */}
                    {error && (
                        <p style={{ color: 'red', fontSize: '0.9em', marginTop: '10px' }}>
                            {error}
                        </p>
                    )}

                    {/* Validaciones */}
                    <div className="password-requirements" style={{ textAlign: 'left', marginTop: '10px' }}>
                        <p style={{ color: passwordValidations.hasCaracter ? 'limegreen' : 'white' }}>
                            • Contiene al menos 6 caracteres
                        </p>
                        <p style={{ color: passwordValidations.hasUppercase ? 'limegreen' : 'white' }}>
                            • Contiene al menos una letra mayúscula
                        </p>
                        <p style={{ color: passwordValidations.hasNumber ? 'limegreen' : 'white' }}>
                            • Contiene al menos un número
                        </p>
                        <p style={{ color: passwordValidations.hasSymbol ? 'limegreen' : 'white' }}>
                            • Contiene al menos un símbolo (!@#$...)
                        </p>
                    </div>

                    <button type="submit" className="register-button" disabled={loading}>
                        {loading ? "Registrando..." : "Registrar"}
                    </button>
                </form>

                <p className="login-link-container">
                    ¿Ya tienes una cuenta? <Link to="/">Iniciar sesión</Link>
                </p>
            </div>
        </div>
    );
}

export default Register;
