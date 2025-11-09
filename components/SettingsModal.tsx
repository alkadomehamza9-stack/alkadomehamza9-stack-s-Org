import React, { useState, useEffect } from 'react';
import Modal from './Modal';
import { Icon } from './Icons';
import { UserType } from '../types';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  userType: UserType;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose, userType }) => {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const correctOldPassword = userType === 'full' ? '110527' : '123456';

  useEffect(() => {
    if (!isOpen) {
      // Reset state when modal is closed
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setError('');
      setSuccess('');
      setIsSubmitting(false);
    }
  }, [isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!currentPassword || !newPassword || !confirmPassword) {
      setError('الرجاء تعبئة جميع الحقول.');
      return;
    }
    if (currentPassword !== correctOldPassword) {
      setError('كلمة المرور الحالية غير صحيحة.');
      return;
    }
    if (newPassword.length < 6) {
      setError('يجب أن تكون كلمة المرور الجديدة 6 أحرف على الأقل.');
      return;
    }
    if (newPassword === currentPassword) {
        setError('كلمة المرور الجديدة يجب أن تكون مختلفة عن الحالية.');
        return;
    }
    if (newPassword !== confirmPassword) {
      setError('كلمتا المرور الجديدتان غير متطابقتين.');
      return;
    }

    setIsSubmitting(true);
    
    // Simulate API call
    setTimeout(() => {
        setIsSubmitting(false);
        setSuccess('تم تغيير كلمة المرور بنجاح. (محاكاة)');
        // In a real app, you would make an API call here.
        // The password will revert on next login as it is hardcoded.
        setTimeout(() => {
            onClose();
        }, 2000);
    }, 1000);
  };

  const InputField = ({ label, type, value, onChange }: { label: string, type: string, value: string, onChange: (e: React.ChangeEvent<HTMLInputElement>) => void }) => (
    <div>
      <label className="block text-sm font-medium text-gray-700">{label}</label>
      <input
        type={type}
        value={value}
        onChange={onChange}
        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm"
        required
      />
    </div>
  );

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="إعدادات الحساب">
      <form onSubmit={handleSubmit} className="space-y-4">
        <p className="text-sm text-gray-600">تغيير كلمة المرور الخاصة بك.</p>
        
        <InputField label="كلمة المرور الحالية" type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} />
        <InputField label="كلمة المرور الجديدة" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
        <InputField label="تأكيد كلمة المرور الجديدة" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />

        {error && <p className="text-red-500 text-sm text-center">{error}</p>}
        {success && <p className="text-green-500 text-sm text-center">{success}</p>}

        <div className="mt-6 flex justify-end gap-3 pt-4 border-t">
          <button type="button" onClick={onClose} className="bg-gray-200 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-300">
            إلغاء
          </button>
          <button type="submit" disabled={isSubmitting} className="bg-purple-600 text-white py-2 px-4 rounded-lg hover:bg-purple-700 disabled:bg-purple-300 flex items-center">
            <Icon name="save" className="w-4 h-4 ml-2" />
            {isSubmitting ? 'جاري الحفظ...' : 'حفظ التغييرات'}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default SettingsModal;
