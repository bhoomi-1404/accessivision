import React from 'react';
import { VISION_MODES } from '../engine/visionConfigs';

export const SvgVisionFilters: React.FC = () => {
  return (
    <svg
      aria-hidden="true"
      style={{ position: 'absolute', width: 0, height: 0, pointerEvents: 'none' }}
    >
      <defs>
        {VISION_MODES.filter((m) => m.matrixValues).map((mode) => (
          <filter
            key={mode.id}
            id={`av-filter-${mode.id}`}
            colorInterpolationFilters="sRGB"
          >
            <feColorMatrix type="matrix" values={mode.matrixValues} result="colormatrix" />
            {mode.id === 'cataracts' && (
              <>
                <feGaussianBlur in="colormatrix" stdDeviation="1.35" result="blurred" />
                <feComponentTransfer in="blurred">
                  <feFuncR type="linear" slope="0.92" intercept="0.05" />
                  <feFuncG type="linear" slope="0.90" intercept="0.04" />
                  <feFuncB type="linear" slope="0.82" intercept="0.02" />
                </feComponentTransfer>
              </>
            )}
          </filter>
        ))}

        <filter id="av-filter-low-acuity" colorInterpolationFilters="sRGB">
          <feGaussianBlur stdDeviation="2.4" />
        </filter>
      </defs>
    </svg>
  );
};
