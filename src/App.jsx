import { useRef, useState } from 'react'
import { upload } from '@vercel/blob/client'

const MAILTO = 'ooovek17@gmail.com'
const MAIL_SUBJECT = 'Заявка на расчёт изготовления детали'
const MAX_FILES = 10
const MAX_FILE_BYTES = 30 * 1024 * 1024
const MAX_TOTAL_BYTES = 100 * 1024 * 1024
const FILE_LIMITS_TEXT =
  'Можно прикрепить до 10 файлов. Размер одного файла — до 30 МБ, общий размер — до 100 МБ.'
const FORM_ERROR_TEXT =
  'Не удалось отправить заявку через сайт. Пожалуйста, попробуйте ещё раз или свяжитесь с нами по контактам ниже.'
const ALLOWED_FILE_EXT = [
  '.pdf',
  '.dwg',
  '.dxf',
  '.step',
  '.stp',
  '.iges',
  '.igs',
  '.jpg',
  '.jpeg',
  '.png',
  '.zip',
  '.rar',
  '.7z',
]
const BLOCKED_FILE_EXT = [
  '.exe',
  '.js',
  '.bat',
  '.cmd',
  '.scr',
  '.ps1',
  '.sh',
  '.vbs',
  '.msi',
  '.html',
  '.php',
]

function fileExtension(name) {
  const base = String(name || '').split(/[/\\]/).pop()
  const dot = base.lastIndexOf('.')
  return dot >= 0 ? base.slice(dot).toLowerCase() : ''
}

function isAllowedUploadName(name) {
  const ext = fileExtension(name)
  if (!ext || BLOCKED_FILE_EXT.includes(ext) || !ALLOWED_FILE_EXT.includes(ext)) {
    return false
  }
  const parts = String(name || '')
    .toLowerCase()
    .split('.')
  return !parts.some((part) => BLOCKED_FILE_EXT.includes(`.${part}`))
}

function formatFileSize(bytes) {
  const n = Number(bytes) || 0
  if (n < 1024 * 1024) {
    const kb = n / 1024
    return `${kb >= 10 ? Math.round(kb) : kb.toFixed(1)} КБ`
  }
  return `${(n / (1024 * 1024)).toFixed(1)} МБ`
}

function isSameFile(a, b) {
  return a.name === b.name && a.size === b.size
}
const imagePath = (name) => `${import.meta.env.BASE_URL}images/${name}`
const PRESENTATION_PDF = `${import.meta.env.BASE_URL}presentation/vek-presentation.pdf`

const navItems = [
  { href: '#services', label: 'Услуги' },
  { href: '#equipment', label: 'Оборудование' },
  { href: '#quality', label: 'Качество' },
  { href: '#works', label: 'Примеры работ' },
  { href: '#process', label: 'Как заказать' },
  { href: '#contacts', label: 'Контакты' },
]

const services = [
  {
    title: 'Токарная обработка с ЧПУ',
    text: 'Изготовление деталей вращения по конструкторской документации заказчика.',
  },
  {
    title: 'Токарно-фрезерная обработка',
    text: 'Обработка сложных деталей за меньшее количество установов на токарно-фрезерных центрах с ЧПУ.',
  },
  {
    title: 'Фрезерная обработка с ЧПУ',
    text: 'Обработка корпусных, плоских и сложнопрофильных деталей на вертикальных фрезерных центрах.',
  },
  {
    title: 'Изготовление по КД заказчика',
    text: 'Работа по чертежам, конструкторской и иной исходной документации предприятий-заказчиков.',
  },
  {
    title: 'Технологическая подготовка',
    text: 'Оценка технологичности, подбор подходящего оборудования и подготовка процесса изготовления.',
  },
  {
    title: 'Управляющие программы',
    text: 'Разработка и отработка управляющих программ для станков с ЧПУ.',
  },
]

const equipmentStats = [
  '5 токарно-фрезерных центров',
  '2 фрезерных центра',
  '3+2 оси на HAAS VF-2SS с наклонно-поворотным столом',
  'Подача прутка на части токарно-фрезерных центров',
]

const turningMillingCenters = [
  'DN Solutions / Doosan PUMA 3050LM',
  'HAAS ST-30Y',
  'Doosan PUMA 2100 LY',
  'DN Solutions / Doosan LYNX 225M-II',
  'DN Solutions / Doosan PUMA 2600LSY',
]

const millingCenters = [
  'HAAS VF-2',
  'HAAS VF-2SS с наклонно-поворотным столом',
]

const advantages = [
  {
    title: 'Собственный производственный участок',
    text: 'Работы выполняются на оборудовании ООО «ВЕК» в Санкт-Петербурге.',
  },
  {
    title: 'Технологическая подготовка',
    text: 'Перед запуском заказа специалисты оценивают документацию, маршрут обработки и особенности изготовления.',
  },
  {
    title: 'Современные ЧПУ-центры',
    text: 'В производстве используются токарно-фрезерные и фрезерные обрабатывающие центры.',
  },
  {
    title: 'Контроль качества',
    text: 'Готовые детали проходят измерительный контроль с использованием собственной измерительной базы.',
  },
]

const measuringCategories = [
  {
    title: 'Линейные измерения',
    text: 'Микрометры, штангенциркули, высотомеры',
  },
  {
    title: 'Контроль геометрии',
    text: 'Угломеры, биениемер, измерительная оснастка',
  },
  {
    title: 'Оптический контроль',
    text: 'Микроскопы и визуальная проверка параметров',
  },
  {
    title: 'Контроль поверхности',
    text: 'Измеритель шероховатости и сопутствующие приборы',
  },
]

const measuringBrands = ['Mahr', 'Mitutoyo', 'Tesa', 'Bowers', 'Planolith', 'Orion']

const works = [
  {
    src: imagePath("work-1.jpg"),
    title: 'Токарно-фрезерная обработка',
    alt: 'Пример токарно-фрезерной обработки деталей',
  },
  {
    src: imagePath("work-2.jpg"),
    title: 'Детали сложной формы',
    alt: 'Пример деталей сложной формы',
  },
  {
    src: imagePath("work-3.jpg"),
    title: 'Корпусные детали',
    alt: 'Пример корпусной детали',
  },
  {
    src: imagePath("work-4.jpg"),
    title: 'Фрезерная обработка',
    alt: 'Пример фрезерной обработки детали',
  },
  {
    src: imagePath("work-5.jpg"),
    title: 'Изготовление по КД заказчика',
    alt: 'Пример изготовления по документации заказчика',
  },
  {
    src: imagePath("work-8.jpg"),
    title: 'Контроль геометрии',
    alt: 'Пример контроля геометрии детали',
  },
]

const equipmentPhotos = [
  {
    src: imagePath("machine-closeup.jpg"),
    alt: 'Токарно-фрезерный центр на производственном участке ООО ВЕК',
    caption: 'Токарно-фрезерный центр',
  },
  {
    src: imagePath("machine-haas-vf2ss.jpg"),
    alt: 'Фрезерный обрабатывающий центр HAAS VF-2SS',
    caption: 'Фрезерный центр HAAS VF-2SS',
  },
  {
    src: imagePath("machine-rotary-table.jpg"),
    alt: 'Наклонно-поворотный стол HAAS',
    caption: 'Наклонно-поворотный стол HAAS',
  },
]

const processSteps = [
  {
    step: '01',
    title: 'Отправьте документацию',
    text: 'Пришлите чертёж, КД, техническое задание или иную исходную документацию.',
  },
  {
    step: '02',
    title: 'Оценка задачи',
    text: 'Специалисты анализируют технологичность, объём работ и особенности изготовления.',
  },
  {
    step: '03',
    title: 'Согласование',
    text: 'Согласовываются стоимость, сроки и условия выполнения заказа.',
  },
  {
    step: '04',
    title: 'Производство',
    text: 'Детали изготавливаются на подходящем оборудовании с ЧПУ.',
  },
  {
    step: '05',
    title: 'Контроль и передача',
    text: 'Готовая продукция проходит контроль и передаётся заказчику.',
  },
]

const contactItems = [
  { label: 'Компания', value: 'ООО «ВЕК»' },
  { label: 'Город', value: 'Санкт-Петербург' },
  { label: 'Телефон', value: '8 (911) 777-81-91' },
  { label: 'E-mail', value: 'ooovek17@gmail.com' },
  {
    label: 'Адрес',
    value: 'Санкт-Петербург, ул. Атаманская, д. 3/6',
  },
  { label: 'Режим работы', value: 'Пн–Пт: 9:00–18:00' },
]

const heroHighlights = [
  'Работа по КД заказчика',
  'Токарная и фрезерная обработка с ЧПУ',
  'Производство в Санкт-Петербурге',
]

const sectionY = 'py-12 sm:py-14 lg:py-16'
const sectionYTight = 'py-10 sm:py-12 lg:py-14'
const cardLight =
  'card-lift group flex h-full flex-col border border-steel-200 bg-white p-5 shadow-card'
const cardMuted =
  'card-lift group flex h-full flex-col border border-steel-200 bg-white p-5 shadow-card'

function Container({ children, className = '' }) {
  return (
    <div className={`mx-auto w-full max-w-container px-4 sm:px-6 lg:px-8 ${className}`}>
      {children}
    </div>
  )
}

function SectionHeading({ eyebrow, title, subtitle, light = false }) {
  return (
    <div className="mx-auto max-w-3xl text-center">
      {eyebrow ? (
        <p
          className={`mb-2 text-[11px] font-semibold uppercase tracking-[0.16em] ${
            light ? 'text-steel-400' : 'text-accent'
          }`}
        >
          {eyebrow}
        </p>
      ) : null}
      <h2
        className={`text-[1.45rem] font-semibold tracking-tight sm:text-2xl lg:text-[1.85rem] ${
          light ? 'text-white' : 'text-graphite-900'
        }`}
      >
        {title}
      </h2>
      {subtitle ? (
        <p
          className={`mt-3 text-sm leading-relaxed sm:text-base ${
            light ? 'text-steel-300' : 'text-steel-500'
          }`}
        >
          {subtitle}
        </p>
      ) : null}
    </div>
  )
}

function EquipmentShot({ src, alt, caption, className = '' }) {
  return (
    <figure
      className={`relative overflow-hidden rounded-md border border-white/15 shadow-card ${className}`}
    >
      <img src={src} alt={alt} className="absolute inset-0 h-full w-full object-cover" />
      <figcaption className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-graphite-950/65 to-transparent px-3 pb-2.5 pt-8 text-xs font-medium text-white">
        {caption}
      </figcaption>
    </figure>
  )
}

function SitePhoto({ src, alt, className = '', overlay = false, rounded = true }) {
  return (
    <div
      className={`relative overflow-hidden ${rounded ? 'rounded-md' : ''} ${className}`}
    >
      <img src={src} alt={alt} className="absolute inset-0 h-full w-full object-cover" />
      {overlay ? (
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-graphite-950/40 via-graphite-950/10 to-transparent" />
      ) : null}
    </div>
  )
}

function Header() {
  const [open, setOpen] = useState(false)

  function closeMenu() {
    setOpen(false)
  }

  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-white/10 bg-graphite-900/85 backdrop-blur-md">
      <Container className="flex h-[5.25rem] items-center justify-between gap-4 lg:gap-5">
        <a href="#top" className="logo-block shrink-0" onClick={closeMenu}>
          <span className="logo-plate">
            <img
              src={imagePath("logo-vek.png")}
              alt="ООО «ВЕК»"
              className="logo-img h-[34px] w-auto max-w-[118px] object-contain mix-blend-lighten lg:h-[42px] lg:max-w-[154px]"
            />
            <span className="logo-plate-caption">Механическая обработка</span>
          </span>
        </a>

        <nav className="hidden shrink-0 items-center gap-3 lg:flex xl:gap-5" aria-label="Основное меню">
          {navItems.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="whitespace-nowrap text-[15px] font-medium text-[#C7D0DA] transition-colors hover:text-white xl:text-base"
            >
              {item.label}
            </a>
          ))}
        </nav>

        <div className="flex shrink-0 items-center gap-2">
          <a
            href="#request"
            className="btn-primary hidden whitespace-nowrap rounded-sm bg-accent px-4 py-2.5 text-base font-medium text-white hover:bg-accent-hover lg:inline-flex"
          >
            Отправить чертёж
          </a>
          <button
            type="button"
            className="inline-flex h-10 w-10 items-center justify-center rounded-sm border border-white/15 text-white lg:hidden"
            aria-expanded={open}
            aria-label={open ? 'Закрыть меню' : 'Открыть меню'}
            onClick={() => setOpen((value) => !value)}
          >
            <span className="sr-only">Меню</span>
            {open ? (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="1.8" />
              </svg>
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M4 7h16M4 12h16M4 17h16" stroke="currentColor" strokeWidth="1.8" />
              </svg>
            )}
          </button>
        </div>
      </Container>

      {open ? (
        <div className="border-t border-white/10 bg-graphite-900/95 lg:hidden">
          <Container className="flex flex-col py-3">
            {navItems.map((item) => (
              <a
                key={item.href}
                href={item.href}
                className="rounded-sm px-2 py-2.5 text-base font-medium text-[#C7D0DA] hover:bg-white/5 hover:text-white"
                onClick={closeMenu}
              >
                {item.label}
              </a>
            ))}
            <a
              href="#request"
              className="btn-primary mt-2 rounded-sm bg-accent px-3 py-2.5 text-center text-sm font-medium text-white hover:bg-accent-hover"
              onClick={closeMenu}
            >
              Отправить чертёж
            </a>
          </Container>
        </div>
      ) : null}
    </header>
  )
}

function Hero() {
  return (
    <section
      id="top"
      className="hero-process relative overflow-hidden pt-16 text-white"
      style={{ '--hero-image': `url(${imagePath("hero-machining-bg.png")})` }}
    >
      <div className="hero-glow" aria-hidden="true" />
      <div className="hero-process-overlay pointer-events-none absolute inset-0" aria-hidden="true" />
      <Container className="relative z-10 py-10 sm:py-11 lg:py-[3.25rem]">
        <div className="hero-fade-in min-w-0 max-w-2xl lg:max-w-3xl">
          <p className="mb-2.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-steel-300">
            Санкт-Петербург · металлообработка с ЧПУ
          </p>
          <h1 className="text-[1.65rem] font-semibold leading-snug tracking-tight text-white sm:text-3xl lg:text-[2.35rem] lg:leading-[1.18] [text-shadow:0_2px_24px_rgba(10,14,20,0.45)]">
            Высокоточная механическая обработка деталей по КД заказчика
          </h1>
          <p className="mt-3.5 max-w-2xl text-sm leading-relaxed text-steel-200 sm:text-base">
            Токарная, токарно-фрезерная и фрезерная обработка на современных
            обрабатывающих центрах с ЧПУ в Санкт-Петербурге.
          </p>
          <div className="mt-5 flex flex-col gap-3 sm:flex-row">
            <a
              href="#request"
              className="btn-primary inline-flex items-center justify-center rounded-sm bg-accent px-5 py-2.5 text-sm font-semibold text-white hover:bg-accent-hover"
            >
              Отправить чертёж на расчёт
            </a>
            <a
              href="#request"
              className="btn-secondary inline-flex items-center justify-center rounded-sm border border-white/25 bg-white/10 px-5 py-2.5 text-sm font-medium text-white"
            >
              Обсудить заказ
            </a>
          </div>
          <ul className="mt-5 grid gap-2 sm:grid-cols-3">
            {heroHighlights.map((item) => (
              <li
                key={item}
                className="border-l-2 border-accent bg-[rgba(10,14,20,0.55)] px-3 py-2 text-[13px] leading-snug text-white"
              >
                {item}
              </li>
            ))}
          </ul>
          <p className="mt-4 max-w-xl text-sm leading-relaxed text-steel-300">
            Изготавливаем детали и сборочные единицы по чертежам, конструкторской и
            иной исходной документации заказчика.
          </p>
        </div>
      </Container>
    </section>
  )
}

function Services() {
  return (
    <section id="services" className={`scroll-mt-[5.5rem] bg-steel-50 ${sectionY}`}>
      <Container>
        <SectionHeading
          eyebrow="Возможности производства"
          title="Изготавливаем детали по вашей документации"
          subtitle="ООО «ВЕК» выполняет механическую обработку деталей на станках с ЧПУ — от технологической подготовки до контроля готовой продукции."
        />
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {services.map((item, index) => (
            <article key={item.title} className={cardMuted}>
              <span className="text-[11px] font-semibold tracking-[0.16em] text-accent">
                0{index + 1}
              </span>
              <span className="mt-3 block h-px w-8 bg-accent/70" />
              <h3 className="mt-3 text-base font-semibold text-graphite-900 sm:text-lg">
                {item.title}
              </h3>
              <p className="mt-2 flex-1 text-sm leading-relaxed text-steel-500">{item.text}</p>
            </article>
          ))}
        </div>
      </Container>
    </section>
  )
}

function Equipment() {
  return (
    <section id="equipment" className={`section-metal scroll-mt-[5.5rem] ${sectionY}`}>
      <Container>
        <SectionHeading
          light
          eyebrow="Станочный парк"
          title="Современный станочный парк с ЧПУ"
          subtitle="Производственный участок оснащён токарно-фрезерными и фрезерными обрабатывающими центрами для выполнения задач различной сложности."
        />
        <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {equipmentStats.map((item) => (
            <div
              key={item}
              className="flex h-full rounded-md border border-white/10 bg-graphite-850 px-4 py-3 text-sm leading-relaxed text-steel-200 shadow-card"
            >
              {item}
            </div>
          ))}
        </div>
        <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-3 lg:grid-rows-3">
          <EquipmentShot
            src={imagePath("hero-production.jpg")}
            alt="Общий вид станочного парка ООО ВЕК"
            caption="Общий вид станочного парка"
            className="aspect-[16/10] min-h-[200px] sm:col-span-3 lg:col-span-2 lg:row-span-3 lg:aspect-auto lg:min-h-0 lg:h-full"
          />
          {equipmentPhotos.map((item) => (
            <EquipmentShot
              key={item.src}
              src={item.src}
              alt={item.alt}
              caption={item.caption}
              className="aspect-[4/3] min-h-[140px]"
            />
          ))}
        </div>
        <div className="mt-6 grid items-stretch gap-4 lg:grid-cols-2">
          <div className="flex h-full flex-col border border-white/10 bg-graphite-850 p-5 sm:p-6">
            <h3 className="text-base font-semibold text-white">Токарно-фрезерные центры</h3>
            <ul className="mt-4 space-y-2.5">
              {turningMillingCenters.map((item) => (
                <li
                  key={item}
                  className="flex gap-3 border-b border-white/5 pb-2.5 text-sm text-steel-300 last:border-0 last:pb-0"
                >
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
          <div className="flex h-full flex-col border border-white/10 bg-graphite-850 p-5 sm:p-6">
            <h3 className="text-base font-semibold text-white">Фрезерные центры</h3>
            <ul className="mt-4 space-y-2.5">
              {millingCenters.map((item) => (
                <li
                  key={item}
                  className="flex gap-3 border-b border-white/5 pb-2.5 text-sm text-steel-300 last:border-0 last:pb-0"
                >
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
        <p className="mt-6 text-center text-sm leading-relaxed text-steel-300">
          Производственный участок также включает рабочие места технолога,
          программиста и контроллера ОТК, участок подготовки заготовок и
          постобработки деталей, место хранения материала и вспомогательное
          оборудование.
        </p>
        <p className="mt-3 text-center text-sm leading-relaxed text-steel-400">
          На главной странице указаны ключевые единицы оборудования. Подробные
          характеристики можно предоставить по запросу или вынести в отдельный
          раздел при расширении сайта.
        </p>
      </Container>
    </section>
  )
}

function WhyVek() {
  return (
    <section className={`bg-steel-100 ${sectionY}`}>
      <Container>
        <SectionHeading
          eyebrow="Почему ООО «ВЕК»"
          title="Инженерный подход к каждому заказу"
        />
        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          {advantages.map((item) => (
            <article key={item.title} className={cardLight}>
              <span className="block h-px w-8 bg-accent/70" />
              <h3 className="mt-3 text-base font-semibold text-graphite-900 sm:text-lg">
                {item.title}
              </h3>
              <p className="mt-2 flex-1 text-sm leading-relaxed text-steel-500">{item.text}</p>
            </article>
          ))}
        </div>
        <p className="mx-auto mt-7 max-w-3xl text-center text-sm leading-relaxed text-steel-500">
          Мы не указываем неподтверждённые сроки, допуски и характеристики. Каждый
          заказ оценивается по предоставленной документации.
        </p>
      </Container>
    </section>
  )
}

function Quality() {
  return (
    <section id="quality" className={`scroll-mt-[5.5rem] bg-steel-50 ${sectionY}`}>
      <Container>
        <SectionHeading
          eyebrow="Контроль качества"
          title="Контроль качества на производственном участке"
          subtitle="Собственная измерительная база позволяет выполнять повседневный и высокоточный контроль изготовленных деталей."
        />
        <div className="mt-6 grid items-stretch gap-6 lg:grid-cols-[1fr_0.9fr]">
          <div>
            <h3 className="text-sm font-semibold tracking-tight text-graphite-900">
              Измерительная база
            </h3>
            <p className="mt-2 text-[1.0625rem] leading-[1.6] text-graphite-700 lg:text-lg">
              Для проверки параметров деталей используются цифровые микрометры,
              штангенциркули, высотомеры, угломеры, микроскопы, твердомеры,
              биениемер и измеритель шероховатости.
            </p>
            <ul className="mt-4 grid grid-cols-1 gap-2 lg:grid-cols-2">
              {measuringCategories.map((item) => (
                <li
                  key={item.title}
                  className="border border-steel-200 bg-white px-3 py-2.5 transition duration-200 hover:border-accent/50"
                >
                  <span className="block h-px w-6 bg-accent/80" />
                  <h4 className="mt-2 text-sm font-semibold text-graphite-900">{item.title}</h4>
                  <p className="mt-1 text-[13px] leading-snug text-steel-500">{item.text}</p>
                </li>
              ))}
            </ul>
            <p className="mt-4 text-base leading-relaxed text-graphite-700">
              В измерительной базе используется оборудование производителей{' '}
              {measuringBrands.join(', ')}.
            </p>
          </div>
          <div className="aspect-[16/10] h-full overflow-hidden rounded-md border border-steel-200 shadow-card lg:aspect-auto">
            <img
              src={imagePath("quality-control.png")}
              alt="Измерительный контроль деталей"
              className="h-full w-full object-cover"
            />
          </div>
        </div>
      </Container>
    </section>
  )
}

function Works() {
  return (
    <section id="works" className={`scroll-mt-[5.5rem] bg-steel-100 ${sectionY}`}>
      <Container>
        <SectionHeading
          eyebrow="Примеры работ"
          title="Примеры выполненных работ"
          subtitle="Изготавливаем детали по документации заказчика. Назначение изделий не раскрывается, если оно не предназначено для публичного размещения."
        />
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {works.map((item) => (
            <article
              key={item.src}
              className="card-lift group flex h-full flex-col overflow-hidden rounded-md border border-steel-200 bg-white shadow-card"
            >
              <SitePhoto src={item.src} alt={item.alt} rounded={false} className="aspect-[4/3]" />
              <div className="flex flex-1 items-center border-t border-steel-100 px-4 py-3">
                <span className="mr-3 h-4 w-px bg-accent/80" />
                <h3 className="text-sm font-semibold text-graphite-900">{item.title}</h3>
              </div>
            </article>
          ))}
        </div>
      </Container>
    </section>
  )
}

function Process() {
  return (
    <section id="process" className={`scroll-mt-[5.5rem] bg-steel-50 ${sectionY}`}>
      <Container>
        <SectionHeading title="Как передать заказ в работу" />
        <ol className="mt-8 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
          {processSteps.map((item) => (
            <li key={item.step} className={cardMuted}>
              <span className="text-[11px] font-semibold tracking-[0.14em] text-accent">
                {item.step}
              </span>
              <span className="mt-3 block h-px w-8 bg-accent/70" />
              <h3 className="mt-3 text-base font-semibold text-graphite-900">
                {item.title}
              </h3>
              <p className="mt-2 flex-1 text-sm leading-relaxed text-steel-500">{item.text}</p>
            </li>
          ))}
        </ol>
        <div className="mt-5 flex flex-col gap-4 border border-steel-200 bg-white p-4 shadow-card lg:flex-row lg:items-center lg:justify-between lg:gap-8 lg:px-5 lg:py-4">
          <div className="min-w-0 lg:max-w-xl">
            <p className="text-base font-semibold text-graphite-900">
              Готовы передать задачу на оценку?
            </p>
            <p className="mt-1.5 text-sm leading-relaxed text-steel-500">
              Отправьте чертёж, КД, ТЗ или иную исходную документацию — специалисты
              ООО «ВЕК» оценят возможность изготовления.
            </p>
          </div>
          <div className="flex shrink-0 flex-col gap-2 sm:flex-row sm:items-center">
            <a
              href="#request"
              className="btn-primary inline-flex items-center justify-center rounded-sm bg-accent px-4 py-2.5 text-sm font-semibold text-white hover:bg-accent-hover"
            >
              Отправить чертёж на расчёт
            </a>
            <a
              href={`mailto:${MAILTO}?subject=${encodeURIComponent(MAIL_SUBJECT)}`}
              className="inline-flex items-center justify-center rounded-sm border border-accent/45 bg-white px-4 py-2.5 text-sm font-medium text-accent transition-colors hover:border-accent hover:bg-accent/5"
            >
              Написать на e-mail
            </a>
          </div>
        </div>
      </Container>
    </section>
  )
}

function About() {
  return (
    <section className={`section-metal text-white ${sectionY}`}>
      <Container className="grid items-center gap-8 lg:grid-cols-[1fr_0.9fr]">
        <div className="min-w-0">
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-steel-400">
            О компании
          </p>
          <h2 className="text-[1.45rem] font-semibold tracking-tight sm:text-2xl lg:text-[1.85rem]">
            ООО «ВЕК» — производственное предприятие в Санкт-Петербурге
          </h2>
          <div className="mt-5 space-y-3 text-sm leading-relaxed text-steel-300 sm:text-base">
            <p>
              ООО «ВЕК» работает с 2015 года. Одно из основных направлений
              деятельности предприятия — высокоточная механическая обработка
              деталей на современных токарно-фрезерных и фрезерных центрах с ЧПУ.
            </p>
            <p>
              Компания выполняет изготовление деталей по конструкторской
              документации заказчика, технологическую подготовку производства,
              разработку управляющих программ и контроль качества готовой
              продукции.
            </p>
            <p>
              Работы могут выполняться как из материала заказчика, так и из
              самостоятельно закупаемого материала после согласования условий
              заказа.
            </p>
          </div>
          <div className="mt-6">
            <a
              href={PRESENTATION_PDF}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-secondary inline-flex items-center justify-center rounded-sm border border-white/25 bg-white/10 px-5 py-2.5 text-sm font-medium text-white"
            >
              Открыть презентацию
            </a>
          </div>
        </div>
        <SitePhoto
          src={imagePath("company-production.jpg")}
          alt="Производственный участок ООО ВЕК"
          overlay
          className="min-h-[220px] lg:min-h-[300px]"
        />
      </Container>
    </section>
  )
}

const requestReadiness = [
  {
    step: '01',
    title: 'Есть идея или образец',
    text: 'Можно начать обсуждение и определить, какие данные потребуются для оценки.',
  },
  {
    step: '02',
    title: 'Есть КД, чертёж или модель',
    text: 'Можно оценивать технологичность, маршрут обработки и основные требования к изготовлению.',
  },
  {
    step: '03',
    title: 'Есть КД и параметры заказа',
    text: 'Указаны материал, объём партии, сроки, доставка, шероховатость, покрытие и контроль.',
    outcome: 'Можно готовить более точное предложение.',
    featured: true,
  },
]

function RequestProcessScene() {
  return (
    <div className="request-aside-scene request-aside-art px-3 py-5 sm:px-5 sm:py-6">
      <svg
        className="h-auto w-full text-accent"
        viewBox="0 0 336 118"
        fill="none"
        aria-hidden="true"
      >
        <rect x="10" y="28" width="46" height="58" rx="2" fill="#ffffff" stroke="currentColor" strokeWidth="1.7" />
        <path d="M18 48c8-10 22-10 30 0" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        <circle cx="33" cy="62" r="5" stroke="currentColor" strokeWidth="1.6" />
        <path
          className="request-route-line"
          d="M62 57h28"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinecap="round"
        />
        <path d="M84 53l8 4-8 4" fill="currentColor" />
        <rect x="96" y="24" width="50" height="66" rx="2" fill="#ffffff" stroke="currentColor" strokeWidth="1.7" />
        <path d="M130 24v14h16" fill="#E8EDF3" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
        <path d="M130 24l16 14" stroke="currentColor" strokeWidth="1.7" />
        <path d="M108 54h26M108 64h20M108 74h14" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        <path
          className="request-route-line"
          d="M152 57h28"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinecap="round"
        />
        <path d="M174 53l8 4-8 4" fill="currentColor" />
        <rect x="186" y="28" width="50" height="58" rx="2" fill="#ffffff" stroke="currentColor" strokeWidth="1.7" />
        <path d="M198 44h26M198 54h26M198 64h18" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        <circle cx="224" cy="64" r="3.2" fill="currentColor" />
        <path
          className="request-route-line"
          d="M242 57h26"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinecap="round"
        />
        <path d="M262 53l8 4-8 4" fill="currentColor" />
        <circle cx="300" cy="57" r="18" fill="#1E5AA8" />
        <path d="M292 57l6 6 12-13" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <div className="mt-2 grid grid-cols-4 gap-1 text-center text-[9px] font-semibold uppercase tracking-[0.1em] text-accent sm:text-[10px]">
        <span>Идея</span>
        <span>КД</span>
        <span>Параметры</span>
        <span>Оценка</span>
      </div>
    </div>
  )
}

function RequestAcceptedScene() {
  return (
    <div className="request-aside-scene request-aside-art px-3 py-5 sm:px-5 sm:py-7">
      <svg
        className="h-auto w-full text-accent"
        viewBox="0 0 320 128"
        fill="none"
        aria-hidden="true"
      >
        <path d="M28 64h264" stroke="#DDE3EA" strokeWidth="3" strokeLinecap="round" />
        <path
          className="request-progress-fill"
          d="M28 64h264"
          stroke="currentColor"
          strokeWidth="3"
          strokeLinecap="round"
        />
        <circle cx="48" cy="64" r="10" fill="#1E5AA8" />
        <circle cx="160" cy="64" r="10" fill="#1E5AA8" />
        <circle cx="272" cy="64" r="22" fill="#1E5AA8" />
        <path
          className="request-success-check"
          d="M262 64l7 7 14-15"
          stroke="#ffffff"
          strokeWidth="2.4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  )
}

function RequestForm() {
  const [sending, setSending] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')
  const [files, setFiles] = useState([])
  const [fileError, setFileError] = useState('')
  const fileInputRef = useRef(null)

  function handleFileChange(event) {
    const input = event.target
    const newFiles = Array.from(event.target.files || []).filter((item) => item instanceof File)
    input.value = ''
    setSuccess(false)

    setFiles((prev) => {
      const next = [...prev]
      let nextFileError = ''

      for (const file of newFiles) {
        if (next.some((item) => isSameFile(item, file))) continue

        if (!isAllowedUploadName(file.name)) {
          nextFileError = 'Этот формат нельзя прикрепить.'
          continue
        }

        const nextTotal = next.reduce((sum, item) => sum + item.size, 0) + file.size
        if (next.length >= MAX_FILES || file.size > MAX_FILE_BYTES || nextTotal > MAX_TOTAL_BYTES) {
          nextFileError = FILE_LIMITS_TEXT
          continue
        }

        next.push(file)
      }

      setFileError(nextFileError)
      return next
    })
  }

  function removeFile(index) {
    setFiles((prev) => prev.filter((_, i) => i !== index))
    setFileError('')
    setError('')
    setSuccess(false)
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setSuccess(false)
    setError('')

    const form = event.currentTarget
    const formData = new FormData(form)
    formData.delete('files')
    formData.delete('file')
    files.forEach((file) => {
      formData.append('files', file)
    })

    const attached = formData.getAll('files').filter((item) => item instanceof File && item.size > 0)
    const total = attached.reduce((sum, file) => sum + file.size, 0)

    if (attached.length > MAX_FILES || total > MAX_TOTAL_BYTES || attached.some((file) => file.size > MAX_FILE_BYTES)) {
      setError(FILE_LIMITS_TEXT)
      return
    }

    if (attached.some((file) => !isAllowedUploadName(file.name))) {
      setError(FORM_ERROR_TEXT)
      return
    }

    setSending(true)

    try {
      formData.delete('files')
      formData.delete('file')

      for (const file of attached) {
        const blob = await upload(`requests/${file.name}`, file, {
          access: 'private',
          handleUploadUrl: '/api/send-request',
          multipart: true,
        })
        if (!blob.pathname) {
          throw new Error('upload_failed')
        }
        formData.append('blobPathname', blob.pathname)
        formData.append('fileName', file.name)
        formData.append('fileSize', String(file.size))
      }

      const response = await fetch('/api/send-request', {
        method: 'POST',
        body: formData,
      })

      if (response.status === 413) {
        setError(FILE_LIMITS_TEXT)
        return
      }

      const payload = await response.json().catch(() => ({}))
      if (!response.ok || !payload.ok) {
        setError(FORM_ERROR_TEXT)
        return
      }

      form.reset()
      setFiles([])
      setFileError('')
      if (fileInputRef.current) fileInputRef.current.value = ''
      setSuccess(true)
    } catch {
      setError(FORM_ERROR_TEXT)
    } finally {
      setSending(false)
    }
  }

  const fieldClass =
    'w-full rounded-sm border border-steel-200 bg-steel-50 px-3 py-2.5 text-sm text-graphite-900 outline-none transition-colors placeholder:text-steel-400 focus:border-accent focus:bg-white'

  return (
    <section id="request" className={`scroll-mt-[5.5rem] bg-steel-100 ${sectionYTight}`}>
      <Container>
        <SectionHeading
          title="Отправьте чертёж на расчёт"
          subtitle="Пришлите чертёж, КД, техническое задание или иную исходную документацию — специалисты ООО «ВЕК» оценят возможность изготовления и подготовят предложение."
        />
        <div className="mt-8 grid gap-5 lg:grid-cols-[0.96fr_1.04fr] lg:items-stretch">
          <aside className="request-aside-panel flex h-full flex-col border border-accent/20 p-5 sm:p-6">
            <div key={success ? 'sent' : 'wait'}>
              {success ? <RequestAcceptedScene /> : <RequestProcessScene />}
            </div>
            {success ? (
              <div className="request-aside-art mt-5">
                <span className="block h-px w-12 bg-accent" />
                <h3 className="mt-4 text-xl font-semibold tracking-tight text-graphite-900 sm:text-2xl">
                  Заявка принята к рассмотрению
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-steel-500 sm:text-base">
                  Документация и описание задачи переданы специалистам ООО «ВЕК».
                </p>
              </div>
            ) : (
              <>
                <span className="mt-5 block h-px w-12 bg-accent" />
                <h3 className="mt-4 text-xl font-semibold tracking-tight text-graphite-900 sm:text-2xl">
                  На каком этапе ваш заказ?
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-steel-500">
                  Чем понятнее исходные данные, объём и требования, тем быстрее
                  для обеих сторон можно оценить технологичность, сроки и стоимость
                  изготовления.
                </p>
                <ol className="mt-4 space-y-2.5">
                  {requestReadiness.map((item) => (
                    <li
                      key={item.step}
                      className={
                        item.featured
                          ? 'flex gap-3 border border-accent/35 bg-accent-muted px-3 py-3'
                          : 'flex gap-3 border border-accent/15 bg-white px-3 py-3'
                      }
                    >
                      <span className="shrink-0 pt-0.5 text-[12px] font-semibold tracking-[0.14em] text-accent">
                        {item.step}
                      </span>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-graphite-900">{item.title}</p>
                        <p className="mt-1 text-sm leading-relaxed text-steel-500">{item.text}</p>
                        {item.outcome ? (
                          <p className="mt-1.5 text-xs leading-relaxed text-accent">{item.outcome}</p>
                        ) : null}
                      </div>
                    </li>
                  ))}
                </ol>
              </>
            )}
            <p className="mt-auto border-t border-accent/15 pt-4 text-sm leading-relaxed text-graphite-800">
              Даже если часть данных пока неизвестна — отправьте то, что есть. Мы подскажем, что
              нужно уточнить.
            </p>
          </aside>
          <form
            className="border border-steel-200 bg-white p-5 shadow-card sm:p-6"
            onSubmit={handleSubmit}
          >
            <div className="grid gap-3.5 sm:grid-cols-2">
              <label className="block text-sm">
                <span className="mb-1.5 block font-medium text-graphite-800">Имя</span>
                <input
                  name="name"
                  type="text"
                  autoComplete="name"
                  placeholder="Ваше имя"
                  className={fieldClass}
                />
              </label>
              <label className="block text-sm">
                <span className="mb-1.5 block font-medium text-graphite-800">Компания</span>
                <input
                  name="company"
                  type="text"
                  autoComplete="organization"
                  placeholder="Название компании"
                  className={fieldClass}
                />
              </label>
              <label className="block text-sm">
                <span className="mb-1.5 block font-medium text-graphite-800">Телефон</span>
                <input
                  name="phone"
                  type="tel"
                  autoComplete="tel"
                  placeholder="+7 ..."
                  className={fieldClass}
                />
              </label>
              <label className="block text-sm">
                <span className="mb-1.5 block font-medium text-graphite-800">E-mail</span>
                <input
                  name="email"
                  type="email"
                  autoComplete="email"
                  placeholder="name@company.ru"
                  className={fieldClass}
                />
              </label>
            </div>
            <label className="mt-3.5 block text-sm">
              <span className="mb-1.5 block font-medium text-graphite-800">Комментарий</span>
              <textarea
                name="message"
                rows="3"
                placeholder="Кратко опишите задачу: деталь, количество, материал или особенности изготовления"
                className={`${fieldClass} resize-y`}
              />
            </label>
            <div className="mt-3.5 block text-sm">
              <span className="mb-1.5 block font-medium text-graphite-800">Файлы</span>
              <p className="mb-1.5 text-sm leading-relaxed text-steel-500">
                Прикрепите чертёж, КД, ТЗ, 3D-модель или архив для расчёта.
              </p>
              <input
                id="request-files"
                ref={fileInputRef}
                name="files"
                type="file"
                multiple
                accept=".pdf,.dwg,.dxf,.step,.stp,.iges,.igs,.jpg,.jpeg,.png,.zip,.rar,.7z"
                className={fieldClass}
                onChange={handleFileChange}
              />
              <label
                htmlFor="request-files"
                className="mt-2 inline-block cursor-pointer text-sm font-medium text-accent transition-colors hover:text-accent-hover"
              >
                Можно добавить ещё файл
              </label>
              {files.length === 0 ? (
                <p className="mt-2 text-xs leading-relaxed text-steel-400">
                  Файлы пока не выбраны.
                </p>
              ) : (
                <div className="mt-3">
                  <p className="text-sm font-medium text-graphite-800">Выбранные файлы:</p>
                  <ol className="mt-2 space-y-1.5">
                    {files.map((file, index) => (
                      <li
                        key={`${file.name}-${file.size}-${file.lastModified}-${index}`}
                        className="flex items-start justify-between gap-3 text-xs leading-relaxed text-steel-500"
                      >
                        <span>
                          <span className="text-graphite-800">
                            {index + 1}. {file.name}
                          </span>
                          {' — '}
                          {formatFileSize(file.size)}
                        </span>
                        <button
                          type="button"
                          onClick={() => removeFile(index)}
                          className="shrink-0 text-xs font-medium text-graphite-800 underline-offset-2 hover:underline"
                        >
                          Удалить
                        </button>
                      </li>
                    ))}
                  </ol>
                </div>
              )}
              {fileError ? (
                <p className="mt-2 text-sm leading-relaxed text-graphite-800">{fileError}</p>
              ) : null}
              <p className="mt-1.5 text-xs leading-relaxed text-steel-400">
                Можно добавить файлы по одному или выбрать несколько сразу.
                <br />
                До 10 файлов: PDF, DWG, DXF, STEP, STP, IGES, JPG, PNG, ZIP, RAR, 7Z.
                <br />
                Один файл — до 30 МБ, общий размер — до 100 МБ.
              </p>
            </div>
            <div className="mt-5 flex flex-col gap-2">
              <button
                type="submit"
                disabled={sending}
                className="btn-primary inline-flex w-full items-center justify-center rounded-sm bg-accent px-5 py-2.5 text-sm font-semibold text-white hover:bg-accent-hover disabled:cursor-wait disabled:opacity-80 sm:w-auto"
              >
                {sending ? 'Отправляем заявку...' : 'Отправить заявку'}
              </button>
              {success ? (
                <div
                  className="request-success-card mt-2 border border-accent/35 bg-accent-muted px-4 py-5 sm:px-6 sm:py-6"
                  role="status"
                  aria-live="polite"
                >
                  <div className="flex items-start gap-4">
                    <span className="request-success-icon flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-accent text-white">
                      <svg className="h-7 w-7" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                        <path
                          className="request-success-check"
                          d="M5 13l4 4L19 7"
                          stroke="currentColor"
                          strokeWidth="2.2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </span>
                    <div className="min-w-0">
                      <p className="text-xl font-semibold tracking-tight text-graphite-900 sm:text-2xl">
                        Заявка отправлена
                      </p>
                      <p className="mt-2 text-sm leading-relaxed text-steel-500 sm:text-base">
                        Мы получили вашу документацию и свяжемся с вами после рассмотрения.
                      </p>
                    </div>
                  </div>
                </div>
              ) : null}
              {error ? (
                <p className="text-sm leading-relaxed text-graphite-800">{error}</p>
              ) : null}
            </div>
          </form>
        </div>
      </Container>
    </section>
  )
}

function Contacts() {
  return (
    <section id="contacts" className={`scroll-mt-[5.5rem] bg-steel-50 ${sectionYTight}`}>
      <Container>
        <div>
          <h2 className="text-[1.45rem] font-semibold tracking-tight text-graphite-900 sm:text-2xl lg:text-[1.85rem]">
            Контакты
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-steel-500 sm:text-base">
            Свяжитесь с нами, чтобы обсудить изготовление деталей по вашей
            документации.
          </p>
        </div>
        <div className="mt-6 grid gap-px overflow-hidden border border-steel-200 bg-steel-200 sm:grid-cols-2 lg:grid-cols-3">
          {contactItems.map((item) => (
            <div key={item.label} className="bg-white px-4 py-3.5">
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-steel-400">
                {item.label}
              </p>
              <p className="mt-1.5 text-sm font-medium text-graphite-900">{item.value}</p>
            </div>
          ))}
        </div>
      </Container>
    </section>
  )
}

function Footer() {
  return (
    <footer className="border-t border-white/10 bg-graphite-950 py-6 text-steel-400">
      <Container className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm font-semibold tracking-[0.16em] text-white">ООО «ВЕК»</p>
        <p className="text-sm">Механическая обработка деталей по КД заказчика</p>
      </Container>
    </footer>
  )
}

export default function App() {
  return (
    <div className="min-h-svh">
      <Header />
      <main>
        <Hero />
        <Services />
        <Equipment />
        <WhyVek />
        <Quality />
        <Works />
        <Process />
        <About />
        <RequestForm />
        <Contacts />
      </main>
      <Footer />
    </div>
  )
}
