
import React, { useState, useEffect } from 'react';
import Modal from './Modal';
import { supabaseAPI } from '../services/supabase';
import { Student } from '../types';
import { GRADES } from '../constants';
import { Icon } from './Icons';

interface EditStudentModalProps {
  isOpen: boolean;
  onClose: () => void;
  student: Student;
  onStudentUpdated: () => void;
}

const EditStudentModal: React.FC<EditStudentModalProps> = ({ isOpen, onClose, student, onStudentUpdated }) => {
  const [formData, setFormData] = useState({
    name: '',
    grade: '',
    class: '',
    national_id: '',
    birth_date: '',
    address: '',
    phone1: '',
    phone2: '',
    email: '',
    parent_name: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (student) {
      setFormData({
        name: student.name || '',
        grade: student.grade || '',
        class: student.class || '',
        national_id: student.national_id || '',
        birth_date: student.birth_date || '',
        address: student.address || '',
        phone1: student.phone1 || '',
        phone2: student.phone2 || '',
        email: student.email || '',
        parent_name: student.parent_name || '',
      });
    }
  }, [student, isOpen]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.grade || !formData.class) {
      setError('الرجاء تعبئة الحقول الإلزامية (الاسم، الصف، الشعبة).');
      return;
    }
    setError('');
    setIsSubmitting(true);
    
    const updatedStudent = await supabaseAPI.updateStudent(student.id, formData);
    setIsSubmitting(false);

    if (updatedStudent) {
      onStudentUpdated();
      onClose();
    } else {
      setError('حدث خطأ أثناء تحديث بيانات الطالب. يرجى المحاولة مرة أخرى.');
    }
  };
  
  const InputField = ({ label, name, value, onChange, required = false, type = 'text' }: { label: string, name: string, value: string, onChange: (e: React.ChangeEvent<HTMLInputElement>) => void, required?: boolean, type?: string }) => (
     <div>
        <label htmlFor={name} className="block text-sm font-medium text-gray-700">{label}{required && <span className="text-red-500">*</span>}</label>
        <input type={type} name={name} id={name} value={value || ''} onChange={onChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm" />
    </div>
  );

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`تعديل بيانات: ${student.name}`}>
      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <InputField label="الاسم الكامل" name="name" value={formData.name} onChange={handleChange} required />
          <div>
            <label htmlFor="grade" className="block text-sm font-medium text-gray-700">الصف<span className="text-red-500">*</span></label>
            <select name="grade" id="grade" value={formData.grade} onChange={handleChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm">
                {GRADES.map(g => <option key={g} value={g}>{g}</option>)}
            </select>
          </div>
          <InputField label="الشعبة" name="class" value={formData.class} onChange={handleChange} required />
          <InputField label="الرقم الوطني" name="national_id" value={formData.national_id} onChange={handleChange} />
          <InputField label="تاريخ الميلاد" name="birth_date" value={formData.birth_date} onChange={handleChange} type="date" />
          <InputField label="العنوان" name="address" value={formData.address} onChange={handleChange} />
          <InputField label="اسم ولي الأمر" name="parent_name" value={formData.parent_name} onChange={handleChange} />
          <InputField label="هاتف 1" name="phone1" value={formData.phone1} onChange={handleChange} />
          <InputField label="هاتف 2" name="phone2" value={formData.phone2} onChange={handleChange} />
          <InputField label="البريد الإلكتروني" name="email" value={formData.email} onChange={handleChange} type="email" />
        </div>
        {error && <p className="text-red-500 text-sm mt-4">{error}</p>}
        <div className="mt-6 flex justify-end gap-3">
          <button type="button" onClick={onClose} className="bg-gray-200 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-300">إلغاء</button>
          <button type="submit" disabled={isSubmitting} className="bg-purple-600 text-white py-2 px-4 rounded-lg hover:bg-purple-700 disabled:bg-purple-300 flex items-center">
            {isSubmitting ? 'جاري الحفظ...' : <><Icon name="save" className="w-4 h-4 ml-2" /> حفظ التغييرات</>}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default EditStudentModal;
