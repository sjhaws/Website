import { useRef, useState, type KeyboardEvent } from 'react'
import cheese from './assets/cheese.png'
import timeLordLogo from './assets/gal1.png'
import profile from './assets/profile.jpg'
import racquetball from './assets/RaCquetball.jpg'
import recumbent from './assets/recumbent.png'
import tardis from './assets/superb-tardis-interior.jpg'
import uofuLogo from './assets/UofUlogo.png'
import usuLogo from './assets/USUlogo.png'
import styles from './About.module.css'

const SECTIONS = [
  { id: 'education', label: 'Education and Work' },
  { id: 'hobbies', label: 'Hobbies' },
  { id: 'family', label: 'Family' },
  { id: 'contact', label: 'Contact' },
] as const

type SectionId = (typeof SECTIONS)[number]['id']

export function Component() {
  const [selected, setSelected] = useState<SectionId>('education')
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([])

  // Arrow keys move between tabs, per the ARIA tabs pattern.
  function onTabKeyDown(event: KeyboardEvent, index: number) {
    const step =
      event.key === 'ArrowDown' || event.key === 'ArrowRight'
        ? 1
        : event.key === 'ArrowUp' || event.key === 'ArrowLeft'
          ? -1
          : 0
    if (!step) return
    event.preventDefault()
    const next = (index + step + SECTIONS.length) % SECTIONS.length
    setSelected(SECTIONS[next].id)
    tabRefs.current[next]?.focus()
  }

  return (
    <div className={styles.page} style={{ backgroundImage: `url(${tardis})` }}>
      <title>Behind the Curtain · HawsFun</title>
      <div className={styles.profile}>
        <img
          src={timeLordLogo}
          alt="Time Lord Logo"
          className={styles.timeLordLogo}
        />
        <h1 className={styles.name}>Steven Haws</h1>
        <img src={profile} alt="Steven picture" className={styles.portrait} />
        <div
          role="tablist"
          aria-label="About me"
          aria-orientation="vertical"
          className={styles.tabs}
        >
          {SECTIONS.map((section, index) => (
            <button
              key={section.id}
              ref={(el) => {
                tabRefs.current[index] = el
              }}
              type="button"
              role="tab"
              id={`tab-${section.id}`}
              aria-selected={selected === section.id}
              aria-controls={`panel-${section.id}`}
              tabIndex={selected === section.id ? 0 : -1}
              className={styles.tab}
              onClick={() => setSelected(section.id)}
              onKeyDown={(event) => onTabKeyDown(event, index)}
            >
              {section.label}
            </button>
          ))}
        </div>
      </div>

      <section
        role="tabpanel"
        id={`panel-${selected}`}
        aria-labelledby={`tab-${selected}`}
        className={styles.panel}
      >
        {selected === 'education' && (
          <>
            <h2>Education and Work</h2>
            <hr />
            <div className={styles.logos}>
              <img
                src={usuLogo}
                alt="Utah State University Logo"
                className={styles.usu}
              />
              <img
                src={uofuLogo}
                alt="University of Utah Logo"
                className={styles.uofu}
              />
            </div>
            <p>
              I graduated from Utah State University with a Business Management
              Degree focusing on Human Resources.
            </p>
            <p>
              For the first 4 years of my carreer, I worked as an in HR starting
              as an Assistant and working my way up to Generalist and
              Constultant. I then joined the IT department to help build a new
              HRIS system in house, got trained as a developer and system
              administrator, and worked on the project for 3 years.
            </p>
            <p>
              After that project ended, I worked as the IT Manager for a growing
              manufacturing company, at which point the company was purchased by
              a PE group and I moved to my next position as a Senior IT Manager
              for a Financial Services company. During that time I got my MSIS
              degree from the University of Utah to keep learning and growing my
              skills.
            </p>
            <p>
              After 4 years, they were purchased by a larger company and I was
              moved to a new position as the IT Project Manager working with
              NetSuite, Workday, our Active Directory (hyrbrid).
            </p>
          </>
        )}
        {selected === 'hobbies' && (
          <>
            <h2>Hobbies</h2>
            <hr />
            <div className={styles.hobbyImages}>
              <img
                src={recumbent}
                alt="Recumbent tricycle logo"
                className={styles.recumbent}
              />
              <img src={cheese} alt="cheese wedge" className={styles.cheese} />
            </div>
            <p>
              My friends and family know me best for my eclectic hobbies, and
              above are two of the most unique. I enjoy riding my recumbent
              trike and making atisanal cheeses.
            </p>
            <p>
              Some of my other hobbies include tinking with my Linux box,
              working on an augmented reality app for a company call Aryzon,
              playing retro video games, water fights, and racquetball.
            </p>
            <img
              src={racquetball}
              alt="Utah State University Racquetball Team Logo"
              className={styles.racquetball}
            />
          </>
        )}
        {selected === 'family' && (
          <>
            <h2>Family</h2>
            <hr />
            <p>
              A few years after gratuating from Utah State University, I ran
              into one of my friends from college. Unknown to her, I had wanted
              to date her in college but didn't have the courage to ask her out.
              After a few months of catching up, we started dating and were
              quickly married.
            </p>
            <p>
              We now have a four more members of our family, all of whom get
              their stubbornness from their father and kindess from their
              mother.
            </p>
          </>
        )}
        {selected === 'contact' && (
          <>
            <h2>Contact</h2>
            <hr />
            <p>
              I am always happy to connect with others, whether it be for work,
              networking, or just to chat about shared interests.
            </p>
            <p>
              Feel free to connect with me on LinkedIn:{' '}
              <a href="https://www.linkedin.com/in/steven-haws/">My LinkedIn</a>
            </p>
          </>
        )}
      </section>
    </div>
  )
}
