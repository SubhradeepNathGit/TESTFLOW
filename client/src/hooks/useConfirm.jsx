import React, { useState } from 'react';
import ConfirmationModal from '../components/modals/ConfirmationModal';

export const useConfirm = () => {
    const [config, setConfig] = useState({
        isOpen: false,
        title: '',
        message: '',
        confirmText: 'Confirm',
        type: 'warning',
        onConfirm: () => {}
    });

    const confirm = (options) => {
        return new Promise((resolve) => {
            setConfig({
                isOpen: true,
                title: options.title || 'Are you sure?',
                message: options.message || 'This action cannot be undone.',
                confirmText: options.confirmText || 'Confirm',
                type: options.type || 'warning',
                onConfirm: () => {
                    setConfig(prev => ({ ...prev, isOpen: false }));
                    resolve(true);
                }
            });
        });
    };

    const close = () => setConfig(prev => ({ ...prev, isOpen: false }));

    const ConfirmModal = () => (
        <ConfirmationModal
            isOpen={config.isOpen}
            onClose={close}
            onConfirm={config.onConfirm}
            title={config.title}
            message={config.message}
            confirmText={config.confirmText}
            type={config.type}
        />
    );

    return { confirm, ConfirmModal };
};
