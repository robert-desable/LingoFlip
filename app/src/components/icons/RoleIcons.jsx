import React, { useId } from 'react';

/**
 * Adult Teacher Icon / Logo
 * Inspired by the reference design:
 * - Circular badge framing.
 * - Upper-right laptop / digital classroom screen with base and notch.
 * - Foreground adult teacher silhouette holding a pointer stick aimed at the screen.
 * - Clean negative space cutouts ensuring dynamic theme adaptability (light, dark, colored badges).
 */
export function AdultTeacherIcon({ className = "w-16 h-16", strokeWidth = 2.6, withCircle = true, ...props }) {
  const rawId = useId();
  const maskId = `teacher-laptop-mask-${rawId.replace(/[^a-zA-Z0-9_-]/g, '')}`;
  const slitMaskId = `teacher-slit-mask-${rawId.replace(/[^a-zA-Z0-9_-]/g, '')}`;

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 100 100"
      fill="none"
      className={className}
      {...props}
    >
      <defs>
        {/* Mask to punch out the laptop wherever the teacher figure & pointer stick overlap it */}
        <mask id={maskId}>
          <rect width="100" height="100" fill="white" />
          {/* Head cutout halo */}
          <circle cx="41.5" cy="45.5" r="11.8" fill="black" />
          {/* Torso & arm cutout */}
          <path
            d="M 28 60 C 28 54, 34 53, 42 53 C 50 53, 54 57, 55.5 63.5 L 63 75.5 C 65 79, 61 83, 56 82 L 53 82 L 53 96 L 28 96 Z"
            fill="black"
          />
          {/* Pointer stick cutout halo */}
          <line
            x1="56"
            y1="63"
            x2="68.5"
            y2="34.5"
            stroke="black"
            strokeWidth="5.5"
            strokeLinecap="round"
          />
        </mask>

        {/* Mask for torso arm slit so background shines through transparently */}
        <mask id={slitMaskId}>
          <rect width="100" height="100" fill="white" />
          {/* Vertical slit separating left arm */}
          <line x1="35.5" y1="67" x2="35.5" y2="86" stroke="black" strokeWidth="2.2" strokeLinecap="round" />
          {/* Pointer stick inner core */}
          <line x1="56.2" y1="62.5" x2="68" y2="35.5" stroke="black" strokeWidth="1.2" strokeLinecap="round" />
        </mask>
      </defs>

      {/* Optional Outer Circular Badge */}
      {withCircle && (
        <circle
          cx="50"
          cy="50"
          r="46.5"
          stroke="currentColor"
          strokeWidth={strokeWidth}
        />
      )}

      {/* Laptop / Screen (masked with cutouts for teacher and pointer) */}
      <g mask={`url(#${maskId})`}>
        {/* Outer screen bezel */}
        <rect
          x="38"
          y="20.5"
          width="41.5"
          height="29.5"
          rx="2.6"
          stroke="currentColor"
          strokeWidth="1.8"
          fill="none"
        />
        {/* Inner solid screen */}
        <rect
          x="40.5"
          y="23"
          width="36.5"
          height="24.5"
          rx="1.2"
          fill="currentColor"
        />
        {/* Laptop base */}
        <path
          d="M 35 50.8 H 82.5 A 1.5 1.5 0 0 1 84 52.3 V 53 A 1 1 0 0 1 83 54 H 34.5 A 1 1 0 0 1 33.5 53 V 52.3 A 1.5 1.5 0 0 1 35 50.8 Z"
          fill="currentColor"
        />
      </g>

      {/* Teacher Figure in Foreground */}
      <g mask={`url(#${slitMaskId})`}>
        {/* Solid Head */}
        <circle cx="41.5" cy="45.5" r="9.2" fill="currentColor" />

        {/* Torso & Shoulders */}
        <path
          d="M 32 94 V 66.5 C 32 60, 36.5 57.5, 42.5 57.5 C 47 57.5, 51 60, 52 64.5 L 56.8 72.8 C 58.2 75.2, 56 78, 53.2 77.2 L 48.5 73.5 V 94 Z"
          fill="currentColor"
        />

        {/* Hand grip */}
        <circle cx="56.2" cy="63.2" r="2.8" fill="currentColor" />

        {/* Pointer stick outline */}
        <line
          x1="56.2"
          y1="62.5"
          x2="68"
          y2="35.5"
          stroke="currentColor"
          strokeWidth="2.8"
          strokeLinecap="round"
        />
      </g>
    </svg>
  );
}

/**
 * Child Student Icon / Logo
 * Inspired by the reference design:
 * - Circular badge framing.
 * - Centered laptop / screen in the upper area.
 * - Group of 3 students in foreground watching the screen (one central leader, two peers).
 * - Authentic arm slits and clean layered depth via SVG masks.
 */
export function ChildStudentIcon({ className = "w-16 h-16", strokeWidth = 2.6, withCircle = true, ...props }) {
  const rawId = useId();
  const centerMaskId = `student-center-mask-${rawId.replace(/[^a-zA-Z0-9_-]/g, '')}`;
  const studentSlitMaskId = `student-slit-mask-${rawId.replace(/[^a-zA-Z0-9_-]/g, '')}`;

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 100 100"
      fill="none"
      className={className}
      {...props}
    >
      <defs>
        {/* Mask to punch out a clean gap behind the foreground center student */}
        <mask id={centerMaskId}>
          <rect width="100" height="100" fill="white" />
          <circle cx="50" cy="52" r="8.8" fill="black" />
          <path
            d="M 37.5 79 V 68.5 C 37.5 61, 43 59, 50 59 C 57 59, 62.5 61, 62.5 68.5 V 79 Z"
            fill="black"
            stroke="black"
            strokeWidth="3.8"
          />
        </mask>

        {/* Slit mask for arms on students */}
        <mask id={studentSlitMaskId}>
          <rect width="100" height="100" fill="white" />
          {/* Left student arm slit */}
          <line x1="28" y1="67.5" x2="28" y2="74.5" stroke="black" strokeWidth="1.8" strokeLinecap="round" />
          {/* Right student arm slit */}
          <line x1="72" y1="67.5" x2="72" y2="74.5" stroke="black" strokeWidth="1.8" strokeLinecap="round" />
          {/* Center student arm slits */}
          <line x1="44" y1="71" x2="44" y2="79" stroke="black" strokeWidth="1.8" strokeLinecap="round" />
          <line x1="56" y1="71" x2="56" y2="79" stroke="black" strokeWidth="1.8" strokeLinecap="round" />
        </mask>
      </defs>

      {/* Optional Outer Circular Badge */}
      {withCircle && (
        <circle
          cx="50"
          cy="50"
          r="46.5"
          stroke="currentColor"
          strokeWidth={strokeWidth}
        />
      )}

      {/* Laptop Screen (centered in upper area) */}
      <g>
        {/* Outer bezel */}
        <rect
          x="37"
          y="18"
          width="26"
          height="18.5"
          rx="2"
          stroke="currentColor"
          strokeWidth="1.6"
          fill="none"
        />
        {/* Inner solid screen */}
        <rect
          x="39"
          y="20"
          width="22"
          height="14.5"
          rx="1"
          fill="currentColor"
        />
        {/* Laptop base */}
        <path
          d="M 34 37 H 66 A 1.2 1.2 0 0 1 67.2 38.2 V 38.6 A 0.8 0.8 0 0 1 66.4 39.4 H 33.6 A 0.8 0.8 0 0 1 32.8 38.6 V 38.2 A 1.2 1.2 0 0 1 34 37 Z"
          fill="currentColor"
        />
      </g>

      {/* Left & Right Students (behind center student, masked by center student cutout) */}
      <g mask={`url(#${centerMaskId})`}>
        <g mask={`url(#${studentSlitMaskId})`}>
          {/* Left Student */}
          <circle cx="34" cy="53" r="5.6" fill="currentColor" />
          <path
            d="M 24.5 74.5 V 68 C 24.5 62.5, 29 60.5, 34 60.5 C 39 60.5, 43.5 62.5, 43.5 68 V 74.5 Z"
            fill="currentColor"
          />

          {/* Right Student */}
          <circle cx="66" cy="53" r="5.6" fill="currentColor" />
          <path
            d="M 56.5 74.5 V 68 C 56.5 62.5, 61 60.5, 66 60.5 C 71 60.5, 75.5 62.5, 75.5 68 V 74.5 Z"
            fill="currentColor"
          />
        </g>
      </g>

      {/* Center Student in Foreground */}
      <g mask={`url(#${studentSlitMaskId})`}>
        <circle cx="50" cy="52" r="6.6" fill="currentColor" />
        <path
          d="M 40 79 V 70.5 C 40 64, 44.5 62, 50 62 C 55.5 62, 60 64, 60 70.5 V 79 Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

// Named aliases for flexibility
export const TeacherLogo = AdultTeacherIcon;
export const StudentLogo = ChildStudentIcon;

export default {
  AdultTeacherIcon,
  ChildStudentIcon,
  TeacherLogo,
  StudentLogo,
};
