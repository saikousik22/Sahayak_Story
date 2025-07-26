
'use client';

import React, { useEffect, useState } from 'react';
import { Skeleton } from './ui/skeleton';

interface MermaidDiagramProps {
  chart: string;
}

// Helper to get the current theme
const getTheme = () =>
  document.documentElement.classList.contains('dark') ? 'dark' : 'light';

export function MermaidDiagram({ chart }: MermaidDiagramProps) {
  const [svg, setSvg] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const renderDiagram = async () => {
      setIsLoading(true);
      try {
        const mermaid = (await import('mermaid')).default;
        
        const currentTheme = getTheme();

        mermaid.initialize({
          startOnLoad: false,
          theme: 'base',
          themeVariables: {
            // General
            fontFamily: 'Belleza, sans-serif',
            fontSize: '16px',

            // Theme-specific
            background: currentTheme === 'dark' ? '#1c1c1c' : '#fafaf5', // bg-background
            primaryColor: currentTheme === 'dark' ? '#3e3e3e' : '#f5f5dc', // bg-card
            primaryTextColor: currentTheme === 'dark' ? '#ffffff' : '#383833',
            primaryBorderColor: '#a9ba9d', // accent
            
            // Node-specific
            nodeBorder: '#a9ba9d',
            
            // Line colors
            lineColor: currentTheme === 'dark' ? '#a9ba9d' : '#9a9a9a',
            
            // Text colors
            textColor: currentTheme === 'dark' ? '#f5f5dc' : '#383833',
            
            // Unused but good to have
            secondaryColor: '#f0f0f0',
            tertiaryColor: '#f0f0f0',
            secondaryTextColor: '#333',
            tertiaryTextColor: '#333',
            secondaryBorderColor: '#000',
            tertiaryBorderColor: '#000',
            clusterBkg: '#f0f0f0',
            clusterBorder: '#000',
            mainBkg: '#f0f0f0',
            errorBkgColor: '#f0f0f0',
            errorTextColor: '#000',
          },
        });

        // Inject custom CSS for better styling
        const css = `
          .node rect, .node circle, .node ellipse, .node polygon { stroke-width: 2px !important; }
          .edge-path path { stroke-width: 2px !important; }
          .label { font-size: 16px !important; font-family: 'Alegreya', serif !important; }
        `;
        const style = document.createElement('style');
        style.innerHTML = css;
        document.head.appendChild(style);

        const { svg: renderedSvg } = await mermaid.render(`mermaid-graph-${Math.random().toString(36).substring(7)}`, chart);
        setSvg(renderedSvg);
      } catch (e) {
        console.error('Failed to render Mermaid diagram:', e);
        setSvg('<p class="text-destructive">Could not render diagram.</p>');
      } finally {
        setIsLoading(false);
      }
    };

    renderDiagram();

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
