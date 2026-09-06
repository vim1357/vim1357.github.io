import { Sidebar } from './components/Sidebar'
import { Section, CardGroup } from './components/primitives'
import { ProductRow, ExperienceRow, Socials } from './components/rows'
import { products, productsSection } from './data/products'
import { experience, experienceSection } from './data/experience'
import { socialsSection } from './data/socials'
import { manifesto, manifestoSection } from './data/manifesto'
import { designExperienceSubtitle } from './lib/experience'

export default function App() {
  return (
    <div className="min-h-screen bg-background text-primary">
      <main className="mx-auto flex max-w-[860px] flex-col gap-16 px-6 py-8 lg:flex-row lg:items-start lg:gap-[100px] lg:py-8">
        <Sidebar />

        <div className="flex w-full flex-col gap-10 lg:w-[400px] lg:flex-none">
          <Section {...productsSection}>
            <CardGroup>
              {products.map((p) => (
                <ProductRow key={p.name} item={p} />
              ))}
            </CardGroup>
          </Section>

          <Section title={experienceSection.title} subtitle={designExperienceSubtitle()}>
            <CardGroup>
              {experience.map((e) => (
                <ExperienceRow key={e.name} item={e} />
              ))}
            </CardGroup>
          </Section>

          <Section {...socialsSection}>
            <Socials />
          </Section>

          <Section {...manifestoSection}>
            <div className="flex flex-col gap-4">
              {manifesto.map((paragraph, i) => (
                <p key={i} className="text-sm leading-5 text-muted">
                  {paragraph}
                </p>
              ))}
            </div>
          </Section>
        </div>
      </main>
    </div>
  )
}
