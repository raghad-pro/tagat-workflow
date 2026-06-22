import { useState, useCallback } from 'react';

export type ActionModalType = 'view' | 'edit' | 'delete' | null;

export function useActionModals<T>() {
  const [activeModal, setActiveModal] = useState<ActionModalType>(null);
  const [selectedRow, setSelectedRow] = useState<T | null>(null);

  const openModal = useCallback((type: ActionModalType, row: T) => {
    setSelectedRow(row);
    setActiveModal(type);
  }, []);

  const closeModal = useCallback(() => {
    setActiveModal(null);
    setTimeout(() => setSelectedRow(null), 200); // Wait for transition before clearing data
  }, []);

  const openView = useCallback((row: T) => openModal('view', row), [openModal]);
  const openEdit = useCallback((row: T) => openModal('edit', row), [openModal]);
  const openDelete = useCallback((row: T) => openModal('delete', row), [openModal]);

  return {
    activeModal,
    selectedRow,
    openView,
    openEdit,
    openDelete,
    closeModal,
  };
}
