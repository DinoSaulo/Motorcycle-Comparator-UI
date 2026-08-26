import { describe, expect, it, beforeEach, afterEach, vi } from 'vitest';
import userEvent from '@testing-library/user-event';
import { fireEvent, renderWithProviders, screen } from '../../testing/test-utils';
import { IMAGE_MAX_BYTES } from '../../services/motorcycleService';
import ImageUploader from './ImageUploader';

function makeFile({ name = 'mt-07.png', type = 'image/png', size = 1024 } = {}) {
  const file = new File(['binary'], name, { type });
  Object.defineProperty(file, 'size', { value: size });
  return file;
}

/** The file input is deliberately `sr-only` and has no label of its own to query by. */
function fileInput() {
  return document.querySelector('input[type="file"]');
}

function renderUploader(props = {}) {
  return renderWithProviders(<ImageUploader {...props} />);
}

describe('ImageUploader', () => {
  beforeEach(() => {
    window.localStorage.setItem('motorcycle-comparator.language', 'en');
    // jsdom implements neither half of the object-URL API.
    URL.createObjectURL = vi.fn(() => 'blob:preview');
    URL.revokeObjectURL = vi.fn();
  });

  afterEach(() => {
    delete URL.createObjectURL;
    delete URL.revokeObjectURL;
  });

  it('describes the drop zone and the accepted formats while empty', () => {
    renderUploader();

    expect(screen.getByText('Image')).toBeInTheDocument();
    expect(screen.getByText('Drag an image here, or choose a file')).toBeInTheDocument();
    expect(screen.getByText('JPEG, PNG or WebP, up to 5.0 MB')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Choose image' })).toBeInTheDocument();
  });

  it('previews an image already stored on the record', () => {
    renderUploader({ imageUrl: '/uploads/mt-07.jpg' });

    expect(screen.getByRole('img', { name: 'Selected motorcycle' })).toHaveAttribute(
      'src',
      expect.stringContaining('/uploads/mt-07.jpg'),
    );
    expect(screen.getByRole('button', { name: 'Replace image' })).toBeInTheDocument();
  });

  it('opens the file picker from the visible button', async () => {
    const user = userEvent.setup();
    renderUploader();

    const click = vi.spyOn(fileInput(), 'click').mockImplementation(() => {});
    await user.click(screen.getByRole('button', { name: 'Choose image' }));

    expect(click).toHaveBeenCalled();
  });

  it('holds the file locally and previews it when the upload is deferred', async () => {
    const onFileSelected = vi.fn();
    const user = userEvent.setup();
    const file = makeFile();

    renderUploader({ onFileSelected });
    await user.upload(fileInput(), file);

    expect(onFileSelected).toHaveBeenCalledWith(file);
    expect(URL.createObjectURL).toHaveBeenCalledWith(file);
    expect(screen.getByRole('img', { name: 'Selected motorcycle' })).toHaveAttribute(
      'src',
      'blob:preview',
    );
    expect(
      screen.getByText('This image is uploaded once the motorcycle has been created.'),
    ).toBeInTheDocument();
  });

  it('uploads straight away when the record already exists', async () => {
    const onUpload = vi.fn();
    const onFileSelected = vi.fn();
    const user = userEvent.setup();
    const file = makeFile();

    renderUploader({ onUpload, onFileSelected });
    await user.upload(fileInput(), file);

    expect(onUpload).toHaveBeenCalledWith(file);
    expect(onFileSelected).not.toHaveBeenCalled();
    expect(URL.createObjectURL).not.toHaveBeenCalled();
  });

  it('releases the previous object URL when a second file is picked', async () => {
    const user = userEvent.setup();
    renderUploader({ onFileSelected: vi.fn() });

    await user.upload(fileInput(), makeFile({ name: 'first.png' }));
    await user.upload(fileInput(), makeFile({ name: 'second.png' }));

    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:preview');
  });

  it('releases the object URL on unmount so the preview cannot leak', async () => {
    const user = userEvent.setup();
    const { unmount } = renderUploader({ onFileSelected: vi.fn() });

    await user.upload(fileInput(), makeFile());
    unmount();

    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:preview');
  });

  it('rejects a file whose type the API would not accept', () => {
    const onFileSelected = vi.fn();
    renderUploader({ onFileSelected });

    // The input's `accept` filter would swallow this file, so it is set directly.
    fireEvent.change(fileInput(), {
      target: { files: [makeFile({ name: 'spec.pdf', type: 'application/pdf' })] },
    });

    expect(screen.getByRole('alert')).toHaveTextContent(
      'Unsupported file type. Choose a JPEG, PNG or WebP image.',
    );
    expect(onFileSelected).not.toHaveBeenCalled();
  });

  it('rejects a file over the size limit before it costs a round trip', async () => {
    const onFileSelected = vi.fn();
    const user = userEvent.setup();

    renderUploader({ onFileSelected });
    await user.upload(fileInput(), makeFile({ size: 6 * 1024 * 1024 }));

    expect(screen.getByRole('alert')).toHaveTextContent('Image is 6.0 MB; the limit is 5.0 MB.');
    expect(onFileSelected).not.toHaveBeenCalled();
  });

  it('accepts a file sitting exactly on the size limit', async () => {
    const onFileSelected = vi.fn();
    const user = userEvent.setup();

    renderUploader({ onFileSelected });
    await user.upload(fileInput(), makeFile({ size: IMAGE_MAX_BYTES }));

    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(onFileSelected).toHaveBeenCalled();
  });

  it('clears a rejection once an acceptable file is chosen', async () => {
    const user = userEvent.setup();
    renderUploader({ onFileSelected: vi.fn() });

    await user.upload(fileInput(), makeFile({ size: 6 * 1024 * 1024 }));
    await user.upload(fileInput(), makeFile());

    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('ignores a change event that carries no file', () => {
    const onFileSelected = vi.fn();
    renderUploader({ onFileSelected });

    fireEvent.change(fileInput(), { target: { files: [] } });

    expect(onFileSelected).not.toHaveBeenCalled();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('drops a pending file without touching the stored record', async () => {
    const onFileSelected = vi.fn();
    const onRemove = vi.fn();
    const user = userEvent.setup();

    renderUploader({ onFileSelected, onRemove });
    await user.upload(fileInput(), makeFile());
    await user.click(screen.getByRole('button', { name: 'Remove' }));

    expect(onFileSelected).toHaveBeenLastCalledWith(null);
    expect(onRemove).not.toHaveBeenCalled();
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
  });

  it('asks the parent to delete an image that is already stored', async () => {
    const onRemove = vi.fn();
    const user = userEvent.setup();

    renderUploader({ imageUrl: '/uploads/mt-07.jpg', onRemove });
    await user.click(screen.getByRole('button', { name: 'Remove' }));

    expect(onRemove).toHaveBeenCalledTimes(1);
  });

  it('offers no remove action while there is nothing to remove', () => {
    renderUploader();
    expect(screen.queryByRole('button', { name: 'Remove' })).not.toBeInTheDocument();
  });

  it('locks the controls and shows progress while an upload is in flight', () => {
    renderUploader({ imageUrl: '/uploads/mt-07.jpg', busy: true, onRemove: vi.fn() });

    expect(screen.getByRole('status')).toHaveTextContent('Uploading image');
    expect(screen.getByRole('button', { name: 'Replace image' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Remove' })).toBeDisabled();
    expect(fileInput()).toBeDisabled();
  });

  it('locks the controls while the surrounding form is submitting', () => {
    renderUploader({ disabled: true });

    expect(screen.getByRole('button', { name: 'Choose image' })).toBeDisabled();
    expect(fileInput()).toBeDisabled();
  });

  it('accepts a file dropped onto the drop zone', () => {
    const onFileSelected = vi.fn();
    renderUploader({ onFileSelected });
    const file = makeFile();
    const zone = screen.getByText('Drag an image here, or choose a file').closest('div').parentElement;

    fireEvent.dragOver(zone);
    fireEvent.drop(zone, { dataTransfer: { files: [file] } });

    expect(onFileSelected).toHaveBeenCalledWith(file);
  });

  it('ignores a drop while the form is disabled', () => {
    const onFileSelected = vi.fn();
    renderUploader({ onFileSelected, disabled: true });
    const zone = screen.getByText('Drag an image here, or choose a file').closest('div').parentElement;

    fireEvent.dragOver(zone);
    fireEvent.dragLeave(zone);
    fireEvent.drop(zone, { dataTransfer: { files: [makeFile()] } });

    expect(onFileSelected).not.toHaveBeenCalled();
  });

  it('ignores a drop that carries no file', () => {
    const onFileSelected = vi.fn();
    renderUploader({ onFileSelected });
    const zone = screen.getByText('Drag an image here, or choose a file').closest('div').parentElement;

    fireEvent.drop(zone, { dataTransfer: { files: [] } });

    expect(onFileSelected).not.toHaveBeenCalled();
  });
});
