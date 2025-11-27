import { ImageResponse } from 'next/og';

export const size = {
  width: 32,
  height: 32,
};

export const contentType = 'image/png';

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#4a148c',
        }}
      >
        <svg
          width="32"
          height="32"
          viewBox="0 0 64 64"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <rect width="64" height="64" rx="12" fill="#4a148c"/>
          <g transform="translate(12, 16)">
            <rect x="8" y="8" width="32" height="24" rx="2" fill="#b794f6" stroke="#6b21a8" strokeWidth="2.5"/>
            <rect x="6" y="6" width="36" height="4" rx="2" fill="#a78bfa" stroke="#6b21a8" strokeWidth="2.5"/>
            <rect x="18" y="4" width="14" height="3" rx="1" fill="#4a148c"/>
            <rect x="20" y="2" width="10" height="8" rx="1" fill="white" stroke="#6b21a8" strokeWidth="1.5"/>
            <line x1="22" y1="4" x2="28" y2="4" stroke="#4a148c" strokeWidth="1"/>
            <line x1="22" y1="5.5" x2="28" y2="5.5" stroke="#4a148c" strokeWidth="1"/>
            <line x1="22" y1="7" x2="28" y2="7" stroke="#4a148c" strokeWidth="1"/>
            <circle cx="20" cy="20" r="1.5" fill="#4a148c"/>
            <circle cx="28" cy="20" r="1.5" fill="#4a148c"/>
            <path d="M 18 24 Q 24 27 30 24" stroke="#4a148c" strokeWidth="2" fill="none" strokeLinecap="round"/>
          </g>
        </svg>
      </div>
    ),
    {
      ...size,
    }
  );
}
