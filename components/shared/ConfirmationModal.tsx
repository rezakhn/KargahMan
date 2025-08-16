import React from 'react';
import Modal from './Modal';
import Button from './Button';

interface ConfirmationModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
}

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  title,
  message,
  onConfirm,
  onCancel,
}) => {
  if (!isOpen) return null;

  return (
    <Modal isOpen={isOpen} onClose={onCancel} title={title}>
      <div>
        <p className="text-on-surface-secondary">{message}</p>
        <div className="mt-6 flex justify-end space-x-3 space-x-reverse">
          <Button variant="secondary" onClick={onCancel}>
            لغو
          </Button>
          <Button variant="danger" onClick={onConfirm}>
            تایید و حذف
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default ConfirmationModal;
