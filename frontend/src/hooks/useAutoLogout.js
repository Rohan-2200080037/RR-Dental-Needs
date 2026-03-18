import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '../store/authStore';
import { toast } from 'react-hot-toast';

const useAutoLogout = (timeoutInMinutes = 5) => {
    const { logout, isAuthenticated } = useAuthStore();
    const navigate = useNavigate();
    const timeoutHandle = useRef(null);

    const resetTimer = () => {
        if (timeoutHandle.current) {
            clearTimeout(timeoutHandle.current);
        }

        if (isAuthenticated) {
            timeoutHandle.current = setTimeout(() => {
                handleLogout();
            }, timeoutInMinutes * 60 * 1000);
        }
    };

    const handleLogout = () => {
        logout();
        navigate('/login');
        toast.error("Session expired due to inactivity", {
            id: 'session-expired', // Preven multiple toasts
        });
    };

    useEffect(() => {
        const events = [
            'mousedown',
            'mousemove',
            'keypress',
            'scroll',
            'touchstart'
        ];

        const handleActivity = () => {
            resetTimer();
        };

        if (isAuthenticated) {
            resetTimer();
            events.forEach(event => {
                window.addEventListener(event, handleActivity);
            });
        }

        return () => {
            if (timeoutHandle.current) {
                clearTimeout(timeoutHandle.current);
            }
            events.forEach(event => {
                window.removeEventListener(event, handleActivity);
            });
        };
    }, [isAuthenticated]);

    return { resetTimer };
};

export default useAutoLogout;
