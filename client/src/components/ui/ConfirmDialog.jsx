import React from 'react';
import { useConfirmStore } from '../../store/confirmStore';
import { Modal } from './Modal';
import { Button } from './Forms';

export default function ConfirmDialog() {
  const { isOpen, message, onConfirm, onCancel, closeConfirm } = useConfirmStore();

  if (!isOpen) return null;

  const handleConfirm = () => {
    if (onConfirm) onConfirm();
    closeConfirm();
  };

  const handleCancel = () => {
    if (onCancel) onCancel();
    closeConfirm();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleCancel} title="Підтвердження">
      <div className="py-4">
        <p className="text-foreground">{message}</p>
      </div>
      <div className="flex justify-end gap-2 pt-4 border-t border-border">
        <Button variant="ghost" onClick={handleCancel}>Скасувати</Button>
        <Button variant="destructive" onClick={handleConfirm}>Підтвердити</Button>
      </div>
    </Modal>
  );
}
