import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './Register.css';

// Íconos Fluent UI (Microsoft Edge)
import {
    Person24Regular,
    Mail24Regular,
    LockClosed24Regular,
    Eye24Regular,
    EyeOff24Regular,
    Checkmark24Filled
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
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [emailFocused, setEmailFocused] = useState(false);

    const [passwordValidations, setPasswordValidations] = useState({
        hasMinLength: false,
        hasUppercase: false,
        hasLowercase: false,
        hasNumber: false,
        hasSymbol: false,
    });

    // VALIDACIÓN DINÁMICA DE CONTRASEÑA
    useEffect(() => {
        setPasswordValidations({
            hasMinLength: formData.password.length >= 6,
            hasUppercase: /[A-Z]/.test(formData.password),
            hasLowercase: /[a-z]/.test(formData.password),
            hasNumber: /\d/.test(formData.password),
            hasSymbol: /[!@#$%^&*(),.?":{}|<>]/.test(formData.password),
        });
    }, [formData.password]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        
        // Validar solo letras y espacios para username
        if (name === 'username') {
            const regex = /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]*$/;
            if (!regex.test(value)) return;
        }

        setFormData({ ...formData, [name]: value });
    };

    // Validar formato de email
    const isValidEmail = (email) => {
        return /^[^\s@]+@(gmail|outlook|hotmail|yahoo|icloud)\.com$/i.test(email);
    };

    const passwordsMatch = formData.password && formData.password2 && formData.password === formData.password2;

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);

        // Validar campos vacíos
        if (!formData.username || !formData.email || !formData.password || !formData.password2) {
            setError("Todos los campos son obligatorios.");
            return;
        }

        // Validar formato de email
        if (!isValidEmail(formData.email)) {
            setError('El correo debe tener un formato válido y terminar en ".com" (gmail, outlook, hotmail, yahoo, icloud).');
            return;
        }

        // Validar contraseñas coincidan
        if (formData.password !== formData.password2) {
            setError("Las contraseñas no coinciden.");
            return;
        }

        // VALIDAR TODOS LOS REQUISITOS DE CONTRASEÑA
        if (
            !passwordValidations.hasMinLength ||
            !passwordValidations.hasUppercase ||
            !passwordValidations.hasLowercase ||
            !passwordValidations.hasNumber ||
            !passwordValidations.hasSymbol
        ) {
            setError("La contraseña debe cumplir todos los requisitos de seguridad.");
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
                // Manejar errores específicos del backend
                if (data.username) {
                    setError("El nombre de usuario ya está en uso.");
                } else if (data.email) {
                    setError("El correo electrónico ya está registrado.");
                } else {
                    setError(data.error || "Error al registrar. Intenta nuevamente.");
                }
            } else {
                console.log("✅ Registro exitoso:", data);
                if (data.token) localStorage.setItem("authToken", data.token);
                
                // Mostrar mensaje de éxito
                alert("¡Tu cuenta ha sido creada correctamente! Redirigiendo al inicio de sesión...");
                
                setTimeout(() => {
                    navigate("/");
                }, 1500);
            }
        } catch (err) {
            console.error("❌ Error de registro:", err);
            setError("Error de conexión. Verifica tu internet e intenta más tarde.");
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
                            onFocus={() => setEmailFocused(true)}
                            onBlur={() => setEmailFocused(false)}
                            required
                        />
                    </div>
                    {emailFocused && !isValidEmail(formData.email) && formData.email && (
                        <p style={{ color: '#888', fontSize: '0.85em', marginTop: '-10px', fontStyle: 'italic' }}>
                            Ejemplo: usuario@gmail.com
                        </p>
                    )}

                    {/* Contraseña */}
                    <div className="input-group" style={{ position: 'relative' }}>
                        <LockClosed24Regular className="input-icon" />
                        <input
                            type={showPassword ? "text" : "password"}
                            name="password"
                            placeholder="Contraseña"
                            value={formData.password}
                            onChange={handleChange}
                            required
                            style={{ paddingRight: '45px' }}
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            style={{
                                position: 'absolute',
                                right: '12px',
                                top: '50%',
                                transform: 'translateY(-50%)',
                                background: 'none',
                                border: 'none',
                                cursor: 'pointer',
                                padding: '0',
                                color: '#888',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                zIndex: 10
                            }}
                        >
                            {showPassword ? <EyeOff24Regular /> : <Eye24Regular />}
                        </button>
                    </div>

                    {/* Confirmar contraseña */}
                    <div className="input-group" style={{ position: 'relative' }}>
                        <LockClosed24Regular className="input-icon" />
                        <input
                            type={showConfirmPassword ? "text" : "password"}
                            name="password2"
                            placeholder="Confirma contraseña"
                            value={formData.password2}
                            onChange={handleChange}
                            required
                            style={{ paddingRight: '45px' }}
                        />
                        <button
                            type="button"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            style={{
                                position: 'absolute',
                                right: '12px',
                                top: '50%',
                                transform: 'translateY(-50%)',
                                background: 'none',
                                border: 'none',
                                cursor: 'pointer',
                                padding: '0',
                                color: '#888',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                zIndex: 10
                            }}
                        >
                            {showConfirmPassword ? <EyeOff24Regular /> : <Eye24Regular />}
                        </button>
                    </div>

                    {/* Indicador de coincidencia de contraseñas */}
                    {formData.password2.length > 0 && (
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            marginTop: '-5px',
                            marginBottom: '10px'
                        }}>
                            {passwordsMatch ? (
                                <>
                                    <Checkmark24Filled style={{ color: 'limegreen' }} />
                                    <span style={{ color: 'limegreen', fontSize: '0.9em', fontWeight: 'bold' }}>
                                        Las contraseñas coinciden
                                    </span>
                                </>
                            ) : (
                                <span style={{ color: '#ff4d4d', fontSize: '0.9em' }}>
                                    ❌ Las contraseñas no coinciden
                                </span>
                            )}
                        </div>
                    )}

                    {/* Error */}
                    {error && (
                        <div style={{
                            backgroundColor: 'rgba(255, 77, 77, 0.1)',
                            border: '1px solid #ff4d4d',
                            borderRadius: '8px',
                            padding: '12px',
                            marginTop: '10px',
                            marginBottom: '10px'
                        }}>
                            <p style={{ color: '#ff4d4d', fontSize: '0.9em', margin: 0 }}>
                                ⚠️ {error}
                            </p>
                        </div>
                    )}

                    {/* Validaciones de contraseña */}
                    <div className="password-requirements" style={{ textAlign: 'left', marginTop: '15px', marginBottom: '15px' }}>
                        <p style={{ color: '#fff', fontWeight: 'bold', marginBottom: '8px' }}>
                            Requisitos de contraseña:
                        </p>
                        <p style={{
                            color: passwordValidations.hasMinLength ? 'limegreen' : '#888',
                            fontSize: '0.9em',
                            margin: '5px 0',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px'
                        }}>
                            {passwordValidations.hasMinLength ? '✓' : '○'} Al menos 6 caracteres
                        </p>
                        <p style={{
                            color: passwordValidations.hasUppercase ? 'limegreen' : '#888',
                            fontSize: '0.9em',
                            margin: '5px 0',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px'
                        }}>
                            {passwordValidations.hasUppercase ? '✓' : '○'} Una letra mayúscula
                        </p>
                        <p style={{
                            color: passwordValidations.hasLowercase ? 'limegreen' : '#888',
                            fontSize: '0.9em',
                            margin: '5px 0',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px'
                        }}>
                            {passwordValidations.hasLowercase ? '✓' : '○'} Una letra minúscula
                        </p>
                        <p style={{
                            color: passwordValidations.hasNumber ? 'limegreen' : '#888',
                            fontSize: '0.9em',
                            margin: '5px 0',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px'
                        }}>
                            {passwordValidations.hasNumber ? '✓' : '○'} Un número
                        </p>
                        <p style={{
                            color: passwordValidations.hasSymbol ? 'limegreen' : '#888',
                            fontSize: '0.9em',
                            margin: '5px 0',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px'
                        }}>
                            {passwordValidations.hasSymbol ? '✓' : '○'} Un símbolo (!@#$%^&*_)
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