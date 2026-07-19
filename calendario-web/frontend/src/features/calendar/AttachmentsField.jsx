import { useEffect, useMemo } from 'react';
import { Icon } from '../../components/ui/index.js';
import { IMAGE_MIME, attachmentIconName, fileUrl } from './calendarUtils.js';

export function AttachmentsField({ existingAttachments, pendingFiles, onFilesChange }) {
  const pendingPreviews = useMemo(
    () =>
      pendingFiles.map((file) => ({
        file,
        url: IMAGE_MIME.test(file.type) ? URL.createObjectURL(file) : null,
      })),
    [pendingFiles],
  );

  useEffect(
    () => () => {
      pendingPreviews.forEach((preview) => {
        if (preview.url) URL.revokeObjectURL(preview.url);
      });
    },
    [pendingPreviews],
  );

  return (
    <div className="field">
      <label htmlFor="event-files">Anexos (fotos ou arquivos, opcional)</label>
      <input
        type="file"
        id="event-files"
        multiple
        accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.txt"
        onChange={(event) => onFilesChange(Array.from(event.target.files || []))}
      />
      <div className="attachments-preview">
        {existingAttachments.map((att) => (
          <div className="attachment-item" key={att.url}>
            {IMAGE_MIME.test(att.mimetype) ? (
              <img className="attachment-thumb" src={fileUrl(att.url)} alt={att.name} />
            ) : (
              <span className="attachment-file">
                <Icon name={attachmentIconName(att.mimetype)} />
              </span>
            )}
            <span className="attachment-name">{att.name}</span>
          </div>
        ))}
        {pendingPreviews.map(({ file, url }, index) => (
          <div className="attachment-item" key={`${file.name}-${index}`}>
            {url ? (
              <img className="attachment-thumb" src={url} alt={file.name} />
            ) : (
              <span className="attachment-file">
                <Icon name={attachmentIconName(file.type) || 'paperclip'} />
              </span>
            )}
            <span className="attachment-name">{file.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
