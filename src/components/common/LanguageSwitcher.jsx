import { useEffect, useId, useRef, useState } from 'react';
import { ChevronDown } from 'lucide-react';
import twemoji from 'twemoji';
import { useLanguage } from '../../hooks/useLanguage';
import { LANGUAGE_NAMES, SUPPORTED_LANGUAGES } from '../../i18n';
import brFlag from '../../assets/flags/br.svg';
import ptFlag from '../../assets/flags/pt.svg';
import usFlag from '../../assets/flags/us.svg';
import gbFlag from '../../assets/flags/gb.svg';

/**
 * Vendored from twemoji's own SVG set (github.com/jdecked/twemoji) — the npm package
 * ships the parser only, no bundled artwork. Keyed by `twemoji.convert.toCodePoint`,
 * the exact scheme twemoji names its own asset files by, so each entry stays
 * traceable back to the flag emoji it renders rather than a bare hex filename.
 */
const FLAGS = {
  [twemoji.convert.toCodePoint('🇧🇷')]: { src: brFlag, name: 'Brazil' },
  [twemoji.convert.toCodePoint('🇵🇹')]: { src: ptFlag, name: 'Portugal' },
  [twemoji.convert.toCodePoint('🇺🇸')]: { src: usFlag, name: 'United States' },
  [twemoji.convert.toCodePoint('🇬🇧')]: { src: gbFlag, name: 'United Kingdom' },
};

// Each language is represented by the flags of its two major speaking regions.
const LANGUAGE_FLAG_EMOJI = {
  pt: ['🇧🇷', '🇵🇹'],
  en: ['🇺🇸', '🇬🇧'],
};

const LANGUAGES = SUPPORTED_LANGUAGES.map((code) => ({
  code,
  nativeName: LANGUAGE_NAMES[code],
  flags: LANGUAGE_FLAG_EMOJI[code].map((emoji) => FLAGS[twemoji.convert.toCodePoint(emoji)]),
}));

function FlagPair({ flags }) {
  return (
    <span className="flex shrink-0 items-center gap-1" aria-hidden="true">
      {flags.map((flag) => (
        <img key={flag.name} src={flag.src} alt="" className="h-3.5 w-auto rounded-[2px] ring-1 ring-black/10" />
      ))}
    </span>
  );
}

/**
 * Replaces a native `<select>`: no browser renders an `<img>` inside an `<option>`,
 * so showing flags next to each language name needs a real listbox. Follows the same
 * ARIA listbox pattern as `AutocompleteDropdown` — the list itself holds DOM focus,
 * `aria-activedescendant` drives the highlighted row, and selection commits on
 * `mousedown` so a click never races the blur that would otherwise close it.
 */
export default function LanguageSwitcher() {
  const { language, setLanguage, t } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const buttonRef = useRef(null);
  const listRef = useRef(null);
  const listboxId = useId();
  const optionId = (code) => `${listboxId}-${code}`;

  const current = LANGUAGES.find((entry) => entry.code === language) ?? LANGUAGES[0];

  function open() {
    setActiveIndex(LANGUAGES.findIndex((entry) => entry.code === language));
    setIsOpen(true);
  }

  function close({ refocusButton = false } = {}) {
    setIsOpen(false);
    setActiveIndex(-1);
    if (refocusButton) buttonRef.current?.focus();
  }

  function commit(code) {
    setLanguage(code);
    close({ refocusButton: true });
  }

  useEffect(() => {
    if (isOpen) listRef.current?.focus();
  }, [isOpen]);

  // Closes on any focus move outside the control — a click elsewhere or Tab moving
  // on — the same outside-interaction handling `Modal.jsx` does for its own dismissal.
  function handleBlur(event) {
    if (!event.currentTarget.contains(event.relatedTarget)) close();
  }

  function handleButtonKeyDown(event) {
    // Enter/Space already trigger the native click below; only the arrow keys need
    // their own handling to open the list pre-selected on the current language.
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      open();
    }
  }

  function handleListKeyDown(event) {
    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        setActiveIndex((index) => (index + 1) % LANGUAGES.length);
        break;
      case 'ArrowUp':
        event.preventDefault();
        setActiveIndex((index) => (index <= 0 ? LANGUAGES.length - 1 : index - 1));
        break;
      case 'Home':
        event.preventDefault();
        setActiveIndex(0);
        break;
      case 'End':
        event.preventDefault();
        setActiveIndex(LANGUAGES.length - 1);
        break;
      case 'Enter':
      case ' ':
        event.preventDefault();
        if (activeIndex >= 0) commit(LANGUAGES[activeIndex].code);
        break;
      case 'Escape':
        event.preventDefault();
        close({ refocusButton: true });
        break;
      case 'Tab':
        close();
        break;
      default:
        break;
    }
  }

  return (
    <div className="relative" onBlur={handleBlur}>
      <button
        ref={buttonRef}
        type="button"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-label={t('nav.languageLabel')}
        onClick={() => (isOpen ? close() : open())}
        onKeyDown={handleButtonKeyDown}
        className="flex items-center gap-1.5 rounded-md border border-zinc-300 bg-white py-1.5 pl-2 pr-2 text-sm font-medium text-zinc-600 transition-colors hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800"
      >
        <FlagPair flags={current.flags} />
        <span className="hidden sm:inline">{current.nativeName}</span>
        <ChevronDown className="size-3.5 text-zinc-400" aria-hidden="true" />
      </button>

      {isOpen && (
        <ul
          ref={listRef}
          id={listboxId}
          role="listbox"
          tabIndex={-1}
          aria-label={t('nav.languageLabel')}
          aria-activedescendant={activeIndex >= 0 ? optionId(LANGUAGES[activeIndex].code) : undefined}
          onKeyDown={handleListKeyDown}
          className="absolute right-0 top-full z-30 mt-2 w-44 overflow-hidden rounded-xl border border-zinc-200 bg-white py-1 shadow-xl outline-none dark:border-zinc-700 dark:bg-zinc-900"
        >
          {LANGUAGES.map((entry, index) => (
            <li
              key={entry.code}
              id={optionId(entry.code)}
              role="option"
              aria-selected={entry.code === language}
              onMouseEnter={() => setActiveIndex(index)}
              onMouseDown={(event) => {
                // The list holds DOM focus, so a plain click would land after the
                // blur that would otherwise close it — mousedown fires first.
                event.preventDefault();
                commit(entry.code);
              }}
              className={[
                'flex cursor-pointer items-center gap-2 px-3 py-2 text-sm',
                index === activeIndex ? 'bg-accent-50 dark:bg-accent-700/20' : '',
                entry.code === language
                  ? 'font-semibold text-accent-700 dark:text-accent-400'
                  : 'text-zinc-700 dark:text-zinc-300',
              ].join(' ')}
            >
              <FlagPair flags={entry.flags} />
              {entry.nativeName}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
