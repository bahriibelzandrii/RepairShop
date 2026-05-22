import React, { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { ImagePlus, X } from 'lucide-react';
import { cn } from '../../lib/utils';

export function FileUpload({ value = [], onChange, maxFiles = 5 }) {
  const onDrop = useCallback(async (acceptedFiles) => {
    const remainingSlots = maxFiles - value.length;
    const filesToProcess = acceptedFiles.slice(0, remainingSlots);

    const newPhotos = await Promise.all(
      filesToProcess.map((file) => {
        return new Promise((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result);
          reader.readAsDataURL(file);
        });
      })
    );

    onChange([...value, ...newPhotos]);
  }, [value, onChange, maxFiles]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': [] },
    maxFiles: maxFiles - value.length,
    disabled: value.length >= maxFiles
  });

  const removePhoto = (index) => {
    const newPhotos = [...value];
    newPhotos.splice(index, 1);
    onChange(newPhotos);
  };

  return (
    <div className="space-y-4">
      <div
        {...getRootProps()}
        className={cn(
          "border-2 border-dashed rounded-lg p-6 flex flex-col items-center justify-center gap-2 transition-colors cursor-pointer",
          isDragActive ? "border-primary bg-primary/5" : "border-border hover:bg-muted",
          value.length >= maxFiles && "opacity-50 cursor-not-allowed"
        )}
      >
        <input {...getInputProps()} />
        <ImagePlus className="text-muted-foreground" size={32} />
        <div className="text-center">
          <p className="text-sm font-medium text-foreground">
            {isDragActive ? 'Відпустіть файли тут...' : 'Перетягніть фото або натисніть'}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            PNG, JPG, до 5MB. Максимум {maxFiles} фото.
          </p>
        </div>
      </div>

      {value.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {value.map((photo, i) => (
            <div key={i} className="relative group aspect-square rounded-lg overflow-hidden border border-border">
              <img src={photo} alt="Preview" className="w-full h-full object-cover" />
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  removePhoto(i);
                }}
                className="absolute top-2 right-2 p-1 rounded-full bg-background/80 text-foreground opacity-0 group-hover:opacity-100 transition-opacity hover:bg-destructive hover:text-destructive-foreground"
              >
                <X size={16} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
