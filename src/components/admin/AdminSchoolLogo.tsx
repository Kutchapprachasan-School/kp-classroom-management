import React from 'react';

interface AdminSchoolLogoProps {
  className?: string;
  size?: number;
  logoUrl?: string;
}

export const AdminSchoolLogo: React.FC<AdminSchoolLogoProps> = ({
  className = '',
  size = 40,
  logoUrl,
}) => {
  const [hasError, setHasError] = React.useState(false);
  const targetSrc = logoUrl && !hasError ? logoUrl : '/school-logo.png';

  return (
    <div
      className={`shrink-0 flex items-center justify-center rounded-xl overflow-hidden bg-white shadow-2xs border border-slate-100 p-0.5 relative select-none ${className}`}
      style={{ width: size, height: size }}
    >
      <img
        src={targetSrc}
        alt="School Logo"
        className="w-full h-full object-contain"
        onError={() => setHasError(true)}
      />
    </div>
  );
};
