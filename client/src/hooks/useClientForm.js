import { useState } from 'react';

const SHOOT_TYPES = [
  'Portrait',
  'Wedding',
  'Corporate/Headshot',
  'Product/Commercial',
  'Family',
  'Maternity',
  'Events',
  'Other',
];

/**
 * Hook to manage the client intake + feedback form state and validation.
 * Keeps all form logic out of JSX.
 */
export function useClientForm() {
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    shoot_type: '',
    notes: '',
  });

  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [errors, setErrors] = useState({});

  function updateField(field, value) {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear field error on change
    if (errors[field]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  }

  function validate() {
    const newErrors = {};

    if (!formData.first_name.trim()) newErrors.first_name = 'First name is required';
    if (!formData.last_name.trim()) newErrors.last_name = 'Last name is required';
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }
    if (!formData.shoot_type) newErrors.shoot_type = 'Please select a shoot type';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  function reset() {
    setFormData({
      first_name: '',
      last_name: '',
      email: '',
      phone: '',
      shoot_type: '',
      notes: '',
    });
    setRating(0);
    setComment('');
    setErrors({});
  }

  return {
    formData,
    rating,
    comment,
    errors,
    setErrors,
    setRating,
    setComment,
    updateField,
    validate,
    reset,
    SHOOT_TYPES,
  };
}
