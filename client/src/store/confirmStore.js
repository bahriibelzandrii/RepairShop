import { create } from 'zustand';

export const useConfirmStore = create((set) => ({
  isOpen: false,
  message: '',
  onConfirm: null,
  onCancel: null,

  showConfirm: (message, onConfirm, onCancel = null) => set({
    isOpen: true,
    message,
    onConfirm,
    onCancel
  }),

  closeConfirm: () => set({
    isOpen: false,
    message: '',
    onConfirm: null,
    onCancel: null
  })
}));
