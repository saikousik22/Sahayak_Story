
'use client';

import React, { useEffect, useState } from 'react';
import { Skeleton } from './ui/skeleton';

interface MermaidDiagramProps {
  chart: string;
}

// Helper to get the current theme
const getTheme = () =>
  document.documentElement.classList.contains('dark') ? 'dark' : 'light';

// Helper to get computed style of CSS variables
const getCssVariable = (variable: string) => {
    if (typeof window === 'undefined') return '';
    return getComputedStyle(document.documentElement).getPropertyValue(variable).trim();
};


export function MermaidDiagram({ chart }: MermaidDiagramProps) {
  const [svg, setSvg] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const renderDiagram = async () => {
      setIsLoading(true);
      try {
        const mermaid = (await import('mermaid')).default;
        
        const currentTheme = getTheme();
        const HSLToHex = (hsl: string) => {
            if (!hsl) return '#000000';
            const [h, s, l] = hsl.match(/\d+/g)!.map(Number);
            const s_norm = s / 100;
            const l_norm = l / 100;
            const c = (1 - Math.abs(2 * l_norm - 1)) * s_norm;
            const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
            const m = l_norm - c / 2;
            let r = 0, g = 0, b = 0;
            if (0 <= h && h < 60) {
                r = c; g = x; b = 0;
            } else if (60 <= h && h < 120) {
                r = x; g = c; b = 0;
            } else if (120 <= h && h < 180) {
                r = 0; g = c; b = x;
            } else if (180 <= h && h < 240) {
                r = 0; g = x; b = c;
            } else if (240 <= h && h < 300) {
                r = x; g = 0; b = c;
            } else if (300 <= h && h < 360) {
                r = c; g = 0; b = x;
            }
            r = Math.round((r + m) * 255);
            g = Math.round((g + m) * 255);
            b = Math.round((b + m) * 255);
            return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
        }

        const background = HSLToHex(getCssVariable('--background'));
        const foreground = HSLToHex(getCssVariable('--foreground'));
        const accent = HSLToHex(getCssVariable('--accent'));
        const card = HSLToHex(getCssVariable('--card'));
        const border = HSLToHex(getCssVariable('--border'));

        mermaid.initialize({
          startOnLoad: false,
          theme: 'base',
          themeVariables: {
            background: background,
            primaryColor: card, // Node background
            primaryTextColor: foreground, // Text inside nodes
            primaryBorderColor: accent, // Border of nodes
            lineColor: border, // Arrow and line color
            textColor: foreground, // Text outside nodes (e.g., edge labels)
            fontFamily: 'Alegreya, serif',
            fontSize: '16px',
          },
        });

        const { svg: renderedSvg } = await mermaid.render(`mermaid-graph-${Math.random().toString(36).substring(7)}`, chart);
        setSvg(renderedSvg);
      } catch (e) {
        console.error('Failed to render Mermaid diagram:', e);
        setSvg('<p class="text-destructive">Could not render diagram.</p>');
      } finally {
        setIsLoading(false);
      }
    };

    // Initial render might not have CSS variables ready, so we wait a bit
    setTimeout(renderDiagram, 50);

    const observer = new MutationObserver(() => {
        renderDiagram();
    });

    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });

    return () => observer.disconnect();

  }, [chart]);

  if (isLoading) {
    return <Skeleton className="w-full h-64" />;
  }

  return svg ? (
    <div dangerouslySetInnerHTML={{ __html: svg }} className="w-full flex justify-center"/>
  ) : null;
}
