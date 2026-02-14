const enhanceCodeBlocks = () => {
  const blocks = document.querySelectorAll('pre');
  blocks.forEach((pre) => {
    if (pre.querySelector('button.copy-button')) return;
    const code = pre.querySelector('code');
    if (!code) return;

    const button = document.createElement('button');
    button.className = 'copy-button';
    button.type = 'button';
    button.textContent = 'コピー';

    button.addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText(code.innerText.trim());
        button.classList.add('copied');
        button.textContent = 'コピー済み';
        setTimeout(() => {
          button.classList.remove('copied');
          button.textContent = 'コピー';
        }, 2000);
      } catch (error) {
        console.error('コピーに失敗しました', error);
      }
    });

    pre.appendChild(button);
  });
};

enhanceCodeBlocks();

document.addEventListener('astro:page-load', enhanceCodeBlocks);

document.addEventListener('astro:after-swap', enhanceCodeBlocks);
