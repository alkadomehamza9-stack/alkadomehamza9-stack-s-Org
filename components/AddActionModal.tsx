
import React, { useState } from 'react';
import Modal from './Modal';
import { supabaseAPI } from '../services/supabase';
import { ActionType } from '../types';
import { ACTION_TYPES } from '../constants';
import { Icon } from './Icons';

interface AddActionModalProps {
  isOpen: boolean;
  onClose: () => void;
  studentId: number;
  onActionAdded: () => void;
}

const AddActionModal: React.FC<AddActionModalProps> = ({ isOpen, onClose, studentId, onActionAdded }) => {
  const [type, setType] = useState<ActionType>(ACTION_TYPES[0]);
  const [note, setNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);
    
    const newAction = await supabaseAPI.addAction({
      student_id: studentId,
      type,
      note: note || undefined,
    });
    
    setIsSubmitting(false);

    if (newAction) {
      onActionAdded();
      onClose();
    } else {
      setError('حدث خطأ أثناء إضافة الإجراء.');
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="إضافة إجراء جديد">
      <form onSubmit={handleSubmit}>
        <div className="space-y-4">
          <div>
            <label htmlFor="type" className="block text-sm font-medium text-gray-700">نوع الإجراء</label>
            <select name="type" id="type" value={type} onChange={(e) => setType(e.target.value as ActionType)} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm" required>
                {ACTION_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <label htmlFor="note" className="block text-sm font-medium text-gray-700">ملاحظات (اختياري)</label>
            <textarea name="note" id="note" value={note} onChange={(e) => setNote(e.target.value)} rows={3} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm" />
          </div>
        </div>
        {error && <p className="text-red-500 text-sm mt-4">{error}</p>}
        <div className="mt-6 flex justify-end gap-3">
          <button type="button" onClick={onClose} className="bg-gray-200 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-300">إلغاء</button>
          <button type="submit" disabled={isSubmitting} className="bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 disabled:bg-green-300 flex items-center">
            {isSubmitting ? 'جاري الإضافة...' : <><Icon name="plus" className="w-4 h-4 ml-2" /> إضافة</>}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default AddActionModal;
