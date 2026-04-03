import type { Book } from '../types/library';

export function createBookCard(
  book: Book,
  coverUrl: string | null,
  options: { inCollection?: boolean } = {},
): HTMLElement {
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

  if (options.inCollection && book.collection) {
    const badge = document.createElement('span');
    badge.className = 'c-bookcard__volume-badge';
    badge.textContent = `T.${book.collection.volume}`;
    article.appendChild(badge);
  }

  const overlay = document.createElement('div');
  overlay.className = 'c-bookcard__overlay';

  const titleEl = document.createElement('p');
  titleEl.className = 'c-bookcard__title';
  titleEl.textContent = book.title;
  overlay.appendChild(titleEl);

  if (book.subtitle) {
    const subtitleEl = document.createElement('p');
    subtitleEl.className = 'c-bookcard__meta';
    subtitleEl.textContent = book.subtitle;
    overlay.appendChild(subtitleEl);
  }

  if (!options.inCollection && book.collection) {
    const meta = document.createElement('p');
    meta.className = 'c-bookcard__meta';
    meta.textContent = `${book.collection.name}\u00a0· T.\u00a0${book.collection.volume}`;
    overlay.appendChild(meta);
  }

  article.appendChild(overlay);
  return article;
}

export function updateCardCover(card: HTMLElement, newCoverUrl: string): void {
  const existing = card.querySelector('.c-bookcard__cover') as HTMLImageElement | null;
  if (existing) {
    existing.src = newCoverUrl;
    return;
  }
  const placeholder = card.querySelector('.c-bookcard__placeholder');
  if (placeholder) placeholder.remove();
  const img = document.createElement('img');
  img.src = newCoverUrl;
  img.alt = '';
  img.width = 200;
  img.height = 200;
  img.loading = 'lazy';
  img.className = 'c-bookcard__cover';
  card.insertBefore(img, card.firstChild);
}

export function createBookListItem(
  book: Book,
  coverUrl: string | null,
  searchValue: string,
  isLoggedIn: boolean,
  options: { inCollection?: boolean } = {},
): HTMLLIElement {
  const li = document.createElement('li');
  li.dataset.search = searchValue;
  li.dataset.bookId = book.id;
  if (coverUrl) li.dataset.coverUrl = coverUrl;

  const card = createBookCard(book, coverUrl, options);

  const openDialog = () => {
    document.dispatchEvent(
      new CustomEvent('open-book-dialog', {
        detail: { book, coverUrl: li.dataset.coverUrl ?? null, isLoggedIn },
      }),
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

export function createCollectionListItem(
  name: string,
  slug: string,
  books: Book[],
  isLoggedIn: boolean,
  getCoverUrl: (book: Book) => string | null,
): HTMLLIElement {
  const li = document.createElement('li');
  const searchValue = [name, ...books.map((b) => `${b.title} ${b.authors.join(' ')}`)].join(' ');
  li.dataset.search = searchValue.toLowerCase();
  li.dataset.collectionSlug = slug;

  const firstCoverUrl = books[0] ? getCoverUrl(books[0]) : null;

  const article = document.createElement('article');
  article.className = 'c-bookcard c-bookcard--collection';
  article.setAttribute('aria-label', name);
  article.setAttribute('role', 'button');
  article.setAttribute('aria-expanded', 'false');
  article.tabIndex = 0;

  if (firstCoverUrl) {
    const img = document.createElement('img');
    img.src = firstCoverUrl;
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
    letter.textContent = (name[0] ?? '?').toUpperCase();
    placeholder.appendChild(letter);
    article.appendChild(placeholder);
  }

  const overlay = document.createElement('div');
  overlay.className = 'c-bookcard__overlay';

  const titleEl = document.createElement('p');
  titleEl.className = 'c-bookcard__title';
  titleEl.textContent = name;
  overlay.appendChild(titleEl);

  const countEl = document.createElement('p');
  countEl.className = 'c-bookcard__meta';
  countEl.textContent = `${books.length} tome${books.length > 1 ? 's' : ''}`;
  overlay.appendChild(countEl);

  article.appendChild(overlay);

  let expanded = false;
  let volumeItems: HTMLLIElement[] = [];

  const toggle = () => {
    expanded = !expanded;
    article.setAttribute('aria-expanded', String(expanded));
    li.classList.toggle('is-expanded', expanded);

    if (expanded) {
      let insertAfter: Element = li;
      for (const book of books) {
        const bookCoverUrl = getCoverUrl(book);
        const volumeLi = createBookListItem(
          book,
          bookCoverUrl,
          `${name} ${book.title} ${book.authors.join(' ')}`.toLowerCase(),
          isLoggedIn,
          { inCollection: true },
        );
        volumeLi.dataset.collectionMember = slug;
        insertAfter.after(volumeLi);
        insertAfter = volumeLi;
        volumeItems.push(volumeLi);
      }
    } else {
      for (const item of volumeItems) item.remove();
      volumeItems = [];
    }
  };

  article.addEventListener('click', toggle);
  article.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      toggle();
    }
  });

  document.addEventListener('book-deleted', ((ev: CustomEvent<{ id: string }>) => {
    const idx = books.findIndex((b) => b.id === ev.detail.id);
    if (idx === -1) return;
    books.splice(idx, 1);

    if (expanded) {
      for (const item of volumeItems) item.remove();
      volumeItems = [];
      expanded = false;
      article.setAttribute('aria-expanded', 'false');
      li.classList.remove('is-expanded');
    }

    if (books.length === 0) {
      li.remove();
    } else {
      countEl.textContent = `${books.length} tome${books.length > 1 ? 's' : ''}`;
    }
  }) as EventListener);

  li.appendChild(article);
  return li;
}

export function buildLetterNav(nav: HTMLElement, letters: Set<string>): void {
  nav.classList.remove('hidden');
  const inner = document.createElement('div');
  inner.className = 'flex gap-1 min-w-max';

  for (const letter of 'ABCDEFGHIJKLMNOPQRSTUVWXYZ') {
    if (letters.has(letter)) {
      const a = document.createElement('a');
      a.href = `#lettre-${letter}`;
      a.textContent = letter;
      a.dataset.letterNav = letter;
      a.className = 'c-btn c-btn--letter';
      inner.appendChild(a);
    } else {
      const span = document.createElement('span');
      span.textContent = letter;
      span.setAttribute('aria-disabled', 'true');
      span.className = 'c-btn c-btn--letter cursor-default select-none';
      inner.appendChild(span);
    }
  }

  nav.appendChild(inner);
}

export function observeLetterSections(container: HTMLElement, nav: HTMLElement): void {
  function setActiveLetter(letter: string): void {
    nav.querySelectorAll<HTMLElement>('[data-letter-nav]').forEach((el) => {
      el.classList.toggle('is-active', el.dataset.letterNav === letter);
    });
    const active = nav.querySelector<HTMLElement>(`[data-letter-nav="${letter}"]`);
    active?.scrollIntoView({ block: 'nearest', inline: 'center', behavior: 'smooth' });
  }

  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          const letter = (entry.target as HTMLElement).dataset.letterSection!;
          setActiveLetter(letter);
          break;
        }
      }
    },
    { rootMargin: '-80px 0px -70% 0px', threshold: 0 },
  );

  container.querySelectorAll<HTMLElement>('[data-letter-section]').forEach((section) => {
    observer.observe(section);
  });

  nav.addEventListener('click', (e) => {
    const target = (e.target as HTMLElement).closest<HTMLElement>('[data-letter-nav]');
    if (target?.dataset.letterNav) setActiveLetter(target.dataset.letterNav);
  });
}
