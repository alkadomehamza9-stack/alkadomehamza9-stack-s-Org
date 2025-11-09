import React, { useState, useEffect } from 'react';
import Modal from './Modal';
import { supabaseAPI } from '../services/supabase';
import { Icon } from './Icons';

interface AddAbsenceModalProps {
  isOpen: boolean;
  onClose: () => void;
  studentId: number;
  onAbsenceAdded: () => void;
}

const AddAbsenceModal: React.FC<AddAbsenceModalProps> = ({ isOpen, onClose, studentId, onAbsenceAdded }) => {
  const [currentDate, setCurrentDate] = useState(new Date().toISOString().split('T')[0]);
  const [dates, setDates] = useState<string[]>([]);
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isOpen) {
      setCurrentDate(new Date().toISOString().split('T')[0]);
      setDates([]);
      setReason('');
      setError('');
      setIsSubmitting(false);
    }
  }, [isOpen]);

  const handleAddDate = () => {
    if (currentDate && !dates.includes(currentDate)) {
      setDates([...dates, currentDate].sort());
    }
  };

  const handleRemoveDate = (dateToRemove: string) => {
    setDates(dates.filter(d => d !== dateToRemove));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (dates.length === 0) {
      setError('الرجاء إضافة تاريخ واحد على الأقل.');
      return;
    }
    setError('');
    setIsSubmitting(true);
    
    const absencesData = dates.map(d => ({
      student_id: studentId,
      absence_date: d,
      reason: reason || undefined,
    }));
    
    const newAbsences = await supabaseAPI.addBulkAbsences(absencesData);
    
    setIsSubmitting(false);

    if (newAbsences) {
      onAbsenceAdded();
      onClose();
    } else {
      setError('حدث خطأ أثناء تسجيل الغياب.');
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="تسجيل غياب جديد">
      <form onSubmit={handleSubmit}>
        <div className="space-y-4">
          <div>
            <label htmlFor="date" className="block text-sm font-medium text-gray-700">تاريخ الغياب</label>
            <div className="flex gap-2 mt-1">
              <input type="date" name="date" id="date" value={currentDate} onChange={(e) => setCurrentDate(e.target.value)} className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm" />
              <button type="button" onClick={handleAddDate} className="bg-purple-600 text-white px-4 rounded-lg hover:bg-purple-700">إضافة</button>
            </div>
          </div>
          
          {dates.length > 0 && (
            <div>
              <p className="text-sm font-medium text-gray-700 mb-2">التواريخ المحددة:</p>
              <div className="max-h-32 overflow-y-auto bg-gray-50 p-2 rounded-md space-y-2">
                {dates.map(d => (
                  <div key={d} className="flex justify-between items-center bg-white p-2 rounded">
                    <span className="text-gray-800">{new Date(d).toLocaleDateString('ar-EG')}</span>
                    <button type="button" onClick={() => handleRemoveDate(d)} className="text-red-500 hover:text-red-700">
                      <Icon name="x" className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div>
            <label htmlFor="reason" className="block text-sm font-medium text-gray-700">السبب (اختياري)</label>
            <textarea name="reason" id="reason" value={reason} onChange={(e) => setReason(e.target.value)} rows={3} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm" />
             <p className="text-xs text-gray-500 mt-1">سيتم تطبيق هذا السبب على جميع تواريخ الغياب المحددة.</p>
          </div>
        </div>
        {error && <p className="text-red-500 text-sm mt-4">{error}</p>}
        <div className="mt-6 flex justify-end gap-3">
          <button type="button" onClick={onClose} className="bg-gray-200 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-300">إلغاء</button>
          <button type="submit" disabled={isSubmitting || dates.length === 0} className="bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700 disabled:bg-red-300 flex items-center">
            {isSubmitting ? 'جاري التسجيل...' : <><Icon name="save" className="w-4 h-4 ml-2" /> تسجيل ({dates.length})</>}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default AddAbsenceModal;