import { usePage } from '@inertiajs/react';
import { useEffect } from 'react';
import { Toaster, toast } from 'sonner';
import { type SharedData } from '@/types';

export function AppToaster() {
    const { flash } = usePage<SharedData>().props;

    useEffect(() => {
        if (!flash) return;

        if (flash.success) {
            toast.success(flash.success, {
                duration: 4000,
            });
        }

        if (flash.error) {
            toast.error(flash.error, {
                duration: 5000,
            });
        }

        if (flash.info) {
            toast.info(flash.info, {
                duration: 4000,
            });
        }

        if (flash.warning) {
            toast.warning(flash.warning, {
                duration: 4000,
            });
        }
    }, [flash]);

    return (
        <Toaster
            position="top-right"
            richColors
            closeButton
            toastOptions={{
                style: {
                    borderRadius: '16px',
                    padding: '12px 16px',
                    fontSize: '13px',
                    fontWeight: 600,
                    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
                },
            }}
        />
    );
}
