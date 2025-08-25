import { useLayoutEffect, useRef } from 'react';
import Quill from 'quill';
import 'quill/dist/quill.snow.css';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  rows?: number;
}

export default function RichTextEditor({ 
  value, 
  onChange, 
  placeholder = "Enter text...", 
  className = "",
  rows = 4 
}: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const quillRef = useRef<Quill | null>(null);
  const isUpdatingRef = useRef(false);
  const onChangeRef = useRef(onChange);

  // Keep onChange reference fresh
  onChangeRef.current = onChange;

  useLayoutEffect(() => {
    const container = editorRef.current;
    if (!container) {
      return;
    }

    let isMounted = true;
    let handleTextChange: (() => void) | null = null;
    let timeoutId: NodeJS.Timeout;

    // More aggressive cleanup of existing Quill instances
    const existingQuill = container.querySelector('.ql-editor');
    if (existingQuill || quillRef.current) {
      console.log('Existing Quill detected, cleaning up...');
      
      // Clean up existing instance
      if (quillRef.current) {
        quillRef.current.off();
        quillRef.current = null;
      }
      
      // Remove all Quill-related elements from the container
      const quillElements = container.querySelectorAll('[class*="ql-"]');
      quillElements.forEach(el => el.remove());
      
      // Remove any toolbar that might be associated with this container
      const previousSibling = container.previousElementSibling;
      if (previousSibling && previousSibling.classList.contains('ql-toolbar')) {
        previousSibling.remove();
      }
      
      // Clean container completely
      container.innerHTML = '';
      container.className = container.className.replace(/ql-\S+/g, '').trim();
    }

    // Remove ALL existing Quill toolbars in the document
    const allToolbars = document.querySelectorAll('.ql-toolbar');
    allToolbars.forEach(toolbar => toolbar.remove());

    console.log('Initializing fresh Quill editor...');

    // Small delay to ensure DOM cleanup is complete
    timeoutId = setTimeout(() => {
      if (!isMounted) return; // Don't initialize if component was unmounted
      
      // Double-check no toolbars exist before creating new instance
      const remainingToolbars = document.querySelectorAll('.ql-toolbar');
      remainingToolbars.forEach(toolbar => toolbar.remove());
      
      try {
        // Initialize Quill with only the features we want
        const quill = new Quill(container, {
          theme: 'snow',
          placeholder: placeholder,
          modules: {
            toolbar: [
              ['bold', 'italic', 'underline'],
              [{ 'color': [] }]
            ]
          },
          formats: ['bold', 'italic', 'underline', 'color']
        });

        console.log('Quill editor initialized:', quill);

        // Handle content changes
        handleTextChange = () => {
          if (!isMounted || isUpdatingRef.current) return;
          
          console.log('Text change event fired!');
          const html = quill.root.innerHTML;
          
          // More comprehensive cleaning for empty content
          const isEmpty = !html || 
                         html === '<p><br></p>' || 
                         html === '<p></p>' || 
                         html.trim() === '' ||
                         html === '<div><br></div>' ||
                         html === '<br>';
          
          const cleanedHtml = isEmpty ? '' : html;
          
          // Debug logging
          console.log('Quill content:', html);
          console.log('Cleaned content:', cleanedHtml);
          console.log('Is empty:', isEmpty);
          
          onChangeRef.current(cleanedHtml);
        };

        quill.on('text-change', handleTextChange);
        quillRef.current = quill;

        // Set initial content
        if (value && value !== '') {
          isUpdatingRef.current = true;
          quill.root.innerHTML = value;
          isUpdatingRef.current = false;
        }
      } catch (error) {
        console.error('Error initializing Quill:', error);
      }
    }, 10); // 10ms delay

    return () => {
      console.log('Cleaning up Quill editor...');
      isMounted = false;
      
      // Clear timeout if component unmounts before initialization
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      
      if (quillRef.current) {
        if (handleTextChange) {
          quillRef.current.off('text-change', handleTextChange);
        } else {
          quillRef.current.off('text-change');
        }
        
        // Complete cleanup
        const toolbar = container.previousElementSibling;
        if (toolbar && toolbar.classList.contains('ql-toolbar')) {
          toolbar.remove();
        }
        
        // Clear the container completely and remove Quill classes
        container.innerHTML = '';
        container.className = container.className.replace(/ql-\S+/g, '').trim();
        
        quillRef.current = null;
      }
    };
  }, []); // Empty dependency array - only initialize once

  // Update placeholder when it changes
  useLayoutEffect(() => {
    if (quillRef.current && placeholder) {
      quillRef.current.root.setAttribute('data-placeholder', placeholder);
    }
  }, [placeholder]);

  // Update content when value prop changes
  useLayoutEffect(() => {
    if (quillRef.current && !isUpdatingRef.current) {
      const currentContent = quillRef.current.root.innerHTML;
      const cleanCurrentContent = currentContent === '<p><br></p>' ? '' : currentContent;
      
      // Only update if content is actually different
      if (cleanCurrentContent !== value) {
        console.log('Updating Quill content from props:', value);
        isUpdatingRef.current = true;
        
        if (!value || value === '') {
          quillRef.current.setText('');
        } else {
          quillRef.current.root.innerHTML = value;
        }
        
        isUpdatingRef.current = false;
      }
    }
  }, [value]);

  return (
    <div className={`${className}`}>
      <div 
        ref={editorRef}
        style={{
          minHeight: `${rows * 24}px`
        }}
      />
    </div>
  );
}