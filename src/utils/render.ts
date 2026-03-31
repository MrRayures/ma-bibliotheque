import type { Book } from '../types/library';

export function createBookCard(book: Book, coverUrl: string | null): HTMLElement {
  const article = document.createElement('article');
  article.className = 'c-bookcard';
  article.setAttribute('aria-label', book.title);
  article.tabIndex = 0;

  if (coverUrl) {
    const img = document.createElement('img');
    img.src = coverUrl;
    img.alt = '';
    img.width = 200;
    img.height = 200;
    img.loading = 'lazy';
    img.className = 'c-bookcard__cover';
    article.appendChild(img);
  } else {
    const placeholder = document.createElement('div');
    placeholder.className = 'c-bookcard__placeholder';
    const letter = document.createElement('span');
    letter.className = 'c-bookcard__placeholder-letter';
    letter.setAttribute('aria-hidden', 'true');
    letter.textContent = (book.title[0] ?? '?').toUpperCase();
    placeholder.appendChild(letter);
    article.appendChild(placeholder);
  }

  const overlay = document.createElement('div');
  overlay.className = 'c-bookcard__overlay';

  const titleEl = document.createElement('p');
  titleEl.className = 'c-bookcard__title';
  titleEl.textContent = book.title;
  overlay.appendChild(titleEl);

  if (book.collection) {
    const meta = document.createElement('p');
    meta.className = 'c-bookcard__meta';
    meta.textContent = `${book.collection.name}\u00a0· T.\u00a0${book.collection.volume}`;
    overlay.appendChild(meta);
  }

  article.appendChild(overlay);
  return article;
}

export function createBookListItem(
  book: Book,
  coverUrl: string | null,
  searchValue: string,
  isLoggedIn: boolean,
): HTMLLIElement {
  const li = document.createElement('li');
  li.dataset.search = searchValue;
  li.dataset.bookId = book.id;

  const card = createBookCard(book, coverUrl);

  const openDialog = () => {
    document.dispatchEvent(
      new CustomEvent('open-book-dialog', { detail: { book, coverUrl, isLoggedIn } }),
    );
  };

  card.addEventListener('click', openDialog);
  card.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      openDialog();
    }
  });

  li.appendChild(card);
  return li;
}
