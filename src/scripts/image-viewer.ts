const dialog = document.querySelector<HTMLDialogElement>('[data-image-dialog]');
const dialogImage = dialog?.querySelector<HTMLImageElement>(
  '[data-image-dialog-image]',
);

if (dialog && dialogImage) {
  for (const trigger of document.querySelectorAll<HTMLButtonElement>(
    '[data-full-size-image]',
  )) {
    trigger.addEventListener('click', () => {
      const { fullSizeSrc, fullSizeAlt = '' } = trigger.dataset;
      if (!fullSizeSrc) return;

      dialogImage.src = fullSizeSrc;
      dialogImage.alt = fullSizeAlt;
      dialog.showModal();
    });
  }

  dialog.addEventListener('close', () => {
    dialogImage.removeAttribute('src');
    dialogImage.alt = '';
  });
}
