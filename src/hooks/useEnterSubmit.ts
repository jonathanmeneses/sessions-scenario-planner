import { KeyboardEvent } from 'react';

interface UseEnterSubmitProps {
  onSubmit: () => void;
  isEnabled?: boolean;
}

export const useEnterSubmit = ({
  onSubmit,
  isEnabled = true,
}: UseEnterSubmitProps) => {
  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && isEnabled) {
      onSubmit();
    }
  };

  return { handleKeyDown };
};
