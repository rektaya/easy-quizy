# Word review of 2026-10-22: proposed changes

All 1,474 words were read, topic by topic. **399 changes are proposed, in 10 groups.** **Applied on 2026-10-22: groups A, B, C, D, E, F, G, H and K (all of them except I, the removals).** Group I is still open.
Each line shows the word, the field, the **current value → the proposed value**. To approve, name the groups ("apply A, B, C, E, F, G, H")
and mention any word you want left out. The changes live in `scripts/words/review_patch.txt`; `scripts/words/apply_review.py` applies them.

| group | what | how sure I am |
|---|---|---|
| A | the example sentence is about a different word (*Wolle*'s example is the verb *wollen*) | very: these are mistakes |
| B | the meaning is wrong or cut off (*Münze* = "money, in its senses as") | very |
| C | the meaning wording (brackets, "bank; bench", "to show, make see") | high |
| D | the main example is replaced by a simple, literal sentence (a name, an idiom, a sad or odd sentence) | taste: I wrote the new sentences myself, short and plain; please skim |
| E | tier (the difficulty ladder), mostly words that look common only because another word shares their spelling | high |
| F | plurals that are wrong or belong to another word (*Milch* → "Milchen") | high |
| G | "family words" that are not family (*Untersuchung* → "Suche") | high |
| H | lemma form: *der Erwachsener* → *der Erwachsene*, *Nachtklub* → *Nachtclub* (saved ratings are carried over) | high |
| I | remove the word (niche, duplicate or dark) | your call |
| K | only the English translation is wrong | very |

**Already applied, no approval needed** (automatic fixes of the generated "often together with" and extra examples, plus two one-word fixes):
no stock names, no vulgar, violent or sad sentences, no cut-off translations, no sentences that are almost the main example; a word is not "together with"
its own forms (schon/schonen) or its possessive spelling (meine/meinen); no generic partners (haben, sein, können, noch...); sentences about a different
word (Herd/Herde, Reis/Reise) are blocked per word in `scripts/words/extras_blocklist.txt`; *hier* is now just "here"; *machen* → family "machbar".

---

## A. The example is about another word (69)

- **Reis** `ex`: Ihre Gespräche drehten sich um ihre Reise. // Their talks centered on their trip.  →  Zum Mittagessen gibt es oft Reis oder Nudeln. // We often have rice or noodles for lunch.
- **Schnitte** `ex`: Wie tief sind die Schnitte? // How deep are the cuts?  →  Sie isst eine Schnitte Brot mit Käse. // She is eating a slice of bread with cheese.
- **Wolle** `ex`: Wollen Sie auch an diesem Kurs teilnehmen? // Do you also want to take part in this course?  →  Der Pullover ist aus Wolle. // The sweater is made of wool.
- **schick** `ex`: Ich möchte diese hier nach Japan schicken. // I'd like to send these to Japan.  →  Das Kleid ist sehr schick. // The dress is very smart.
- **Sage** `ex`: Sage ihr, sie solle nicht nach mir suchen. // Tell her to not look for me.  →  Das ist nur eine alte Sage. // That is just an old legend.
- **Kissen** `ex`: Ich habe zwei Mädchen beim Küssen gesehen. // I saw two girls kissing.  →  Ich lege ein Kissen unter den Kopf. // I put a cushion under my head.
- **See** `ex`: Auf Ihrer rechten Seite sehen Sie die See. // You can see the sea on your right.  →  Wir schwimmen gern im See. // We like swimming in the lake.
- **niesen** `ex`: Ich habe es genossen, mit ihm zu sprechen. // I enjoyed talking with him.  →  Ich muss niesen. // I have to sneeze.
- **tot** `ex`: Zehn Jahre sind seit seinem Tod vergangen. // Ten years have gone by since his death.  →  Der Vogel ist tot. // The bird is dead.
- **schmerzen** `ex`: Der Schmerz ist größtenteils verschwunden. // The pain has mostly gone away.  →  Mein Rücken schmerzt. // My back hurts.
- **duften** `ex`: Dieser Blume entströmt ein starker Duft. // This flower gives off a strong fragrance.  →  Die Rosen duften wunderbar. // The roses smell wonderful.
- **Fliege** `ex`: Ich wünschte, ich hätte Flügel zum Fliegen. // I wish I had wings to fly.  →  Eine Fliege sitzt an der Wand. // A fly is sitting on the wall.
- **fressen** `ex`: Erst kommt das Fressen, dann kommt die Moral. // First comes the stomach, then comes ethics.  →  Der Hund frisst sein Futter. // The dog is eating its food.
- **Käfer** `ex`: Mein Vater hat früher einen Käfer gefahren. // My dad used to drive a Beetle.  →  Ein Käfer sitzt auf dem Blatt. // A beetle is sitting on the leaf.
- **Mann** `ex`: Man muss den Worten Taten folgen lassen. // You have to turn words into deeds.  →  Der Mann liest die Zeitung. // The man is reading the newspaper.
- **feiern** `ex`: Ich traf einen Herrn Kimura auf der Feier. // I met a Mr Kimura at the party.  →  Wir feiern heute meinen Geburtstag. // We are celebrating my birthday today.
- **turnen** `ex`: Sie vollzog einen U-Turn. // She performed a U-turn.  →  Die Kinder turnen in der Turnhalle. // The children do gymnastics in the gym.
- **Ware** `ex`: Waren Sie das gestern Abend im Fernsehen? // Was that you on TV last night?  →  Die Ware ist im Angebot. // The goods are on sale.
- **wert** `ex`: Könnt ihr den Wert des Diamanten schätzen? // Can you guess the worth of the diamond?  →  Das Buch ist viel Geld wert. // The book is worth a lot of money.
- **ausgeben** `ex`: Zehntausend Yen decken nicht die Ausgaben. // Ten thousand yen will not cover the expenses.  →  Ich gebe zu viel Geld aus. // I spend too much money.
- **Rate** `ex`: Raten Sie mal, was ich gerne machen möchte! // Guess what I want to do.  →  Ich zahle das Auto in Raten. // I am paying for the car in instalments.
- **blocken** `ex`: Sie wohnen im gleichen Block wie wir. // They live in our block.  →  Ich blocke diese Nummer. // I am blocking this number.
- **malen** `ex`: Wie viele Male hast du den Film gesehen? // How many times did you see the movie?  →  Sie malt ein Bild. // She is painting a picture.
- **filmen** `ex`: Der Film war so traurig, dass alle weinten. // The movie was so sad that everybody cried.  →  Er filmt den Sonnenuntergang. // He is filming the sunset.
- **Würde** `ex`: Würden Sie mir bitte den Pfeffer reichen? // Could you please pass me the pepper?  →  Er behandelt alle mit Würde. // He treats everyone with dignity.
- **Leid** `ex`: Tut mir Leid, ich kann dir nicht folgen. // I'm sorry, I don't follow.  →  Er hat viel Leid erlebt. // He has experienced a lot of suffering.
- **gefallen** `ex`: Sie haben alle abgestorbenen Bäume gefällt. // They chopped down all the withered trees.  →  Das Kleid gefällt mir. // I like the dress.
- **Glaube** `ex`: Glauben Sie, ihre Geschichte stimmt nicht? // Do you think her story is false?  →  Ihr Glaube an Gott ist stark. // Her faith in God is strong.
- **lügen** `ex`: Nicht jede unwahre Aussage ist eine Lüge. // Not every untrue statement is a lie.  →  Ich lüge nie. // I never lie.
- **schreien** `ex`: Plötzlich hörte ich einen schrillen Schrei. // All at once, I heard a shrill cry.  →  Das Baby schreit laut. // The baby is screaming loudly.
- **aussprechen** `ex`: Frau Ogawa spielt ausgesprochen gut Tennis. // Mrs. Ogawa is really good at tennis.  →  Wie spricht man dieses Wort aus? // How do you pronounce this word?
- **danken** `ex`: Vielen Dank im Voraus für deine Mitarbeit. // Thank you in advance for your cooperation.  →  Ich danke dir für deine Hilfe. // I thank you for your help.
- **Dank** `ex`: Vielen Dank im Voraus für eure Mitarbeit. // Thank you in advance for your cooperation.  →  Vielen Dank für deine Hilfe! // Thank you very much for your help!
- **schonen** `ex`: Ich habe dieses Lied schon einmal gehört. // I've heard that song before.  →  Wir müssen die Umwelt schonen. // We must protect the environment.
- **sichern** `ex`: Ich bin mir sicher, dass er falsch liegt. // I am positive that he is wrong.  →  Wir sichern die Daten. // We are backing up the data.
- **leben** `ex`: Das Leben beginnt, wenn man Steuern zahlt. // Life begins when you pay taxes.  →  Wir leben in Berlin. // We live in Berlin.
- **sitzen** `ex`: Ich überließ einer alten Dame meinen Sitz. // I gave up my seat to an old lady.  →  Ich sitze am Tisch. // I am sitting at the table.
- **platzen** `ex`: Wer wird den Platz seiner Mutter einnehmen? // Who will take the place of his mother?  →  Der Ballon platzt gleich. // The balloon is about to burst.
- **weg** `ex`: Unser Wagen ist auf dem Weg kaputtgegangen. // Our car broke down on our way there.  →  Er ist schon weg. // He has already left.
- **fallen** `ex`: Die Schlagzeile fiel mir heute Morgen auf. // The headline caught my eye this morning.  →  Das Kind fällt hin. // The child falls down.
- **ziehen** `ex`: Da mir kalt war, zog ich meinen Mantel an. // Since I was cold, I put on my coat.  →  Er zieht den Wagen. // He is pulling the cart.
- **passen** `ex`: Pass in vollen Zügen auf Taschendiebe auf. // Look out for pickpockets on crowded trains.  →  Die Schuhe passen mir gut. // The shoes fit me well.
- **fest** `ex`: Wir planen ein kleines Fest morgen abend. // We are going to give a party tomorrow evening.  →  Das Brett ist fest. // The board is firm.
- **nah** `ex`: Nächstes Jahr werde ich nach Amerika gehen. // I am going to go to America next year.  →  Der Bahnhof ist ganz nah. // The station is very close.
- **laut** `ex`: Er sieht den Wald vor lauter Bäumen nicht. // He doesn't see the forest for the trees.  →  Die Musik ist zu laut. // The music is too loud.
- **viel** `ex`: Echte Freundschaft ist mehr wert als Geld. // Real friendship is more valuable than money.  →  Ich habe viel zu tun. // I have a lot to do.
- **super** `ex`: Fährt der Wagen mit Normal oder mit Super? // Does this car use regular or premium?  →  Das Essen war super. // The food was great.
- **lieb** `ex`: Der Frühling ist meine liebste Jahreszeit. // Spring is my favourite season.  →  Das ist sehr lieb von dir. // That is very kind of you.
- **fern** `ex`: Meine Mutter sieht des Abends selten fern. // My mother seldom watches TV at night.  →  Das Dorf liegt fern von der Stadt. // The village is far from the city.
- **verschieden** `ex`: Sein Bruder ist letzten Monat verschieden. // His brother passed away last month.  →  Wir haben verschiedene Meinungen. // We have different opinions.
- **Morgen** `ex`: Morgen werde ich in der Bibliothek lernen. // Tomorrow, I'm going to study at the library.  →  Am Morgen trinke ich Kaffee. // In the morning I drink coffee.
- **danach** `ex`: Ich habe den ganzen Morgen danach gesucht. // I've been looking for it all morning.  →  Zuerst esse ich, danach gehe ich spazieren. // First I eat, afterwards I go for a walk.
- **arbeiten** `ex`: Jetzt muss ich mich meiner Arbeit zuwenden. // Now I must go about my work.  →  Ich arbeite im Büro. // I work in the office.
- **schweißen** `ex`: Er wischte sich den Schweiß von der Stirn. // He wiped the sweat from his forehead.  →  Er schweißt zwei Metallteile zusammen. // He is welding two pieces of metal together.
- **Versuch** `ex`: Versuch, schlechte Gesellschaft zu meiden. // Try to avoid bad company.  →  Der Versuch war erfolgreich. // The attempt was successful.
- **zweifeln** `ex`: Ich habe keinen Zweifel an seinem Erfolg. // I have no doubt that he will succeed.  →  Ich zweifle an dieser Idee. // I doubt this idea.
- **vorhaben** `ex`: Ich befürworte ein solches Vorhaben nicht. // I'm not in favor of such a plan.  →  Was hast du am Wochenende vor? // What are you planning for the weekend?
- **Satz** `ex`: Beethovens Fünfte Sinfonie hat vier Sätze. // Beethoven's Fifth Symphony has four movements.  →  Dieser Satz ist sehr lang. // This sentence is very long.
- **zählen** `ex`: Ich wusste, dass ich auf dich zählen kann! // I knew I could rely on you!  →  Ich zähle bis zehn. // I count to ten.
- **Papier** `ex`: Er hatte einen guten Blick auf die Papiere. // He had a good look at the papers.  →  Ich brauche ein Blatt Papier. // I need a sheet of paper.
- **treffen** `ex`: Es trifft sich ausgezeichnet, dass... // It is entirely fitting that...  →  Ich treffe meine Freunde am Samstag. // I am meeting my friends on Saturday.
- **Abstimmung** `ex`: Die Abstimmung hat mal wieder nicht geklappt. // Again, co-ordination didn’t work.  →  Die Abstimmung ist morgen. // The vote is tomorrow.
- **hassen** `ex`: Die Rabenkrähen hassten auf den Waldkauz. // The carrion crows mobbed the tawny owl.  →  Ich hasse es, früh aufzustehen. // I hate getting up early.
- **Kennzeichen** `ex`: Haben Sie besondere Kennzeichen? // Do you have special licence plates?  →  Das Auto hat ein deutsches Kennzeichen. // The car has a German license plate.
- **Gericht** `ex`: Ich bereite gerne traditionelle Gerichte zu. // I like to cook traditional dishes.  →  Er steht vor Gericht. // He is on trial.
- **Opfer** `ex`: Ich will, dass du unter mir stehst, du Opfer. // I want you to be beneath me, you wimp.  →  Das Opfer wurde ins Krankenhaus gebracht. // The victim was taken to the hospital.
- **Sitz** `ex`: Die Firma hat ihren Sitz an der Westküste. // The company is located on the West Coast.  →  Der Sitz im Zug ist bequem. // The seat on the train is comfortable.
- **Maschine** `ex`: Die Maschine war am Vormittag gestartet. // The plane took off this morning.  →  Die Maschine ist kaputt. // The machine is broken.
- **Verfassung** `ex`: Sie ist in guter körperlicher Verfassung. // She's in good physical condition.  →  Die Verfassung schützt die Rechte der Bürger. // The constitution protects the rights of citizens.

## B. Wrong or broken meaning (41)

- **Kumpel** `en`: miner  →  buddy, mate
- **Schrank** `en`: cabinet, or:  →  cupboard, closet
- **Münze** `en`: money, in its senses as  →  coin
- **Sänger** `en`: agent noun of singen, singer  →  singer
- **Dose** `en`: box  →  can, tin
- **einrichten** `en`: to establish  →  to furnish, to set up
- **Stift** `en`: pin  →  pen, pencil
- **durchfallen** `en`: to fall through  →  to fail (an exam)
- **Fach** `en`: compartment  →  school subject, compartment
- **peinlich** `en`: woeful, hurtful  →  embarrassing
- **unruhig** `en`: noisy  →  restless, uneasy
- **Erbschaft** `en`: estate  →  inheritance
- **ersparen** `en`: to save, save up  →  to spare (someone something)
- **Opfer** `en`: sacrifice  →  victim; sacrifice
- **Bank** `en`: bench, pew  →  bank; bench
- **Bank** `plural`: Bänke  →  Banken
- **Kennzeichen** `en`: characteristic, mark  →  license plate, distinguishing mark
- **Betrieb** `en`: application or process, industry  →  business, operation
- **verschieden** `en`: differently  →  different, various
- **Platz** `en`: square, plaza  →  place, seat, square
- **Gericht** `en`: court  →  court; dish (food)
- **Schuld** `en`: debt  →  guilt, fault; debt
- **ausziehen** `en`: to move out, to vacate  →  to take off (clothes); to move out
- **Zoll** `en`: customs  →  customs, duty
- **Tor** `en`: gate, archway  →  gate, goal
- **Gleis** `en`: railway  →  platform, track
- **Rate** `en`: rate  →  instalment, rate
- **umgehen** `en`: to avoid, bypass  →  to deal with, to bypass
- **schaffen** `en`: to create, to call into being  →  to manage, to create
- **passieren** `en`: to happen  →  to happen; to pass
- **entlassen** `en`: to release  →  to dismiss, to fire; to release
- **leisten** `en`: to perform, to accomplish  →  to afford; to accomplish
- **aufsteigen** `en`: to get on, to mount  →  to rise, to climb
- **Leid** `en`: woe, grief  →  suffering, grief
- **Eis** `en`: ice  →  ice, ice cream
- **wählen** `en`: to choose, to select  →  to vote, to choose, to dial
- **Verfassung** `en`: constitution  →  constitution; condition
- **fern** `en`: remote  →  far, distant
- **weit** `en`: wide  →  far, wide
- **können** `en`: can, to be able to  →  to be able to, can
- **sollen** `en`: should, to be obligated  →  to be supposed to, should

## C. Meaning wording (88)

- **Kuchen** `en`: pie, cake  →  cake
- **servieren** `en`: to serve, to wait  →  to serve
- **blinzeln** `en`: to squint  →  to blink
- **Haut** `en`: skin, hide of a person  →  skin
- **Mund** `en`: mouth of a person  →  mouth
- **Bein** `en`: leg of a person, animal  →  leg
- **Arzt** `en`: doctor (male)  →  doctor
- **Tablette** `en`: tablet  →  pill, tablet
- **Esel** `en`: ass, donkey  →  donkey
- **Affe** `en`: monkey or ape  →  monkey, ape
- **Rotkehlchen** `en`: European robin  →  robin
- **tragen** `en`: to wear; to carry  →  to wear, to carry
- **anhaben** `en`: to wear  →  to have on, to wear
- **Freund** `en`: friend; boyfriend  →  friend, boyfriend
- **Ehefrau** `en`: married woman, wife  →  wife
- **Ehemann** `en`: married man, husband  →  husband
- **Nachbar** `en`: neighbor (male)  →  neighbor
- **Schlafzimmer** `en`: bedroom, bedchamber  →  bedroom
- **Regal** `en`: shelf, shelves  →  shelf
- **Boden** `en`: ground, soil  →  floor, ground
- **Bad** `en`: bath  →  bath, bathroom
- **Lehrer** `en`: teacher (male)  →  teacher
- **Zeugnis** `en`: report card; certificate  →  report card, certificate
- **Preis** `en`: price; prize  →  price, prize
- **Geschäft** `en`: shop; business  →  shop, business
- **Parkplatz** `en`: parking lot, outdoor car park  →  parking space, car park
- **Strecke** `en`: stretch  →  route, distance
- **Auskunft** `en`: enquiry  →  information, inquiry
- **Reiseführer** `en`: guidebook; tour guide  →  guidebook, tour guide
- **Nachricht** `en`: message; news item  →  message, news
- **Geschichte** `en`: history  →  story, history
- **klingen** `en`: to ring, to clink  →  to sound, to ring
- **Kanal** `en`: canal  →  channel; canal
- **Programm** `en`: programme; program  →  program
- **Akustik** `en`: acoustic, acoustics  →  acoustics
- **vorspielen** `en`: to perform something for  →  to play for someone, to audition; to pretend
- **Kritik** `en`: criticism; review  →  criticism, review
- **Land** `en`: country; countryside  →  country, countryside
- **Wahl** `en`: election; choice  →  election, choice
- **Gesellschaft** `en`: society; company  →  society, company
- **früher** `en`: former, erstwhile  →  earlier, in the past
- **allmählich** `en`: gradual  →  gradually
- **Vormittag** `en`: mid-morning, late morning  →  morning (before noon)
- **Uhr** `en`: clock; o’clock  →  clock, o'clock
- **zeigen** `en`: to show, make see  →  to show
- **heißen** `en`: to have a name, to be named  →  to be called
- **Anweisung** `en`: directive, order  →  instruction
- **raten** `en`: to advise, to recommend  →  to advise; to guess
- **Stimme** `en`: voice, call of an animal  →  voice, vote
- **lassen** `en`: to allow, to permit  →  to let, to leave
- **Stück** `en`: one, item  →  piece
- **reichen** `en`: to reach  →  to reach, to be enough
- **laufen** `en`: to walk, to jog  →  to run, to walk
- **sehen** `en`: to see, to have sight  →  to see
- **ziehen** `en`: to pull, to drag  →  to pull; to move (house)
- **angeln** `en`: to angle, to fish  →  to fish (with a rod)
- **natürlich** `en`: natural, normal  →  natural; of course
- **sicher** `en`: safe, secure  →  sure, safe
- **einfach** `en`: easy  →  simple, easy; simply
- **schlecht** `en`: bad, evil  →  bad
- **frei** `en`: free, unenslaved  →  free
- **wirklich** `en`: real  →  really, real
- **bequem** `en`: comfortable; convenient  →  comfortable, convenient
- **vollkommen** `en`: perfect  →  complete, perfect
- **brav** `en`: good, well-behaved or reliable  →  well-behaved, good
- **Fabrik** `en`: plant  →  factory
- **Handel** `en`: deal  →  trade, commerce
- **Kollege** `en`: colleague (male)  →  colleague
- **Chef** `en`: boss (male)  →  boss
- **Chefin** `en`: female boss  →  boss (female)
- **Direktor** `en`: principal  →  director, principal
- **Kündigung** `en`: notice, resignation  →  notice (of termination), resignation
- **glauben** `en`: to believe something  →  to believe, to think
- **Fehler** `en`: fault, error  →  mistake, error
- **Konzept** `en`: blueprint, draft  →  concept, draft
- **Unruhe** `en`: turbulence, perturbation  →  unrest, restlessness
- **nachgeben** `en`: to give way  →  to give in, to yield
- **Glück** `en`: luck; happiness  →  luck, happiness
- **rechnen** `en`: to count, reckon  →  to calculate, to count on
- **Pfund** `en`: pound  →  pound (money, weight)
- **Zeuge** `en`: witness, wit  →  witness
- **Klage** `en`: complaint  →  lawsuit, complaint
- **Verfahren** `en`: procedure, process  →  proceedings, procedure
- **Amt** `en`: agency, department  →  (public) office
- **vorlesen** `en`: to read  →  to read aloud
- **Tafel** `en`: panel, board  →  blackboard, board
- **schätzen** `en`: to estimate, to guess  →  to estimate; to appreciate
- **werden** `en`: to become  →  to become; will (future)

## D. Main example replaced (names, idioms, sad or odd sentences) (131)

- **Penthouse** `ex`: Tom wohnt in einem Penthouse im dreißigsten Stock. // Tom lives in a penthouse on the 30th floor.  →  Sie wohnt in einem Penthouse mit Dachterrasse. // She lives in a penthouse with a roof terrace.
- **Erbschaft** `ex`: Tom hat seine ganze Erbschaft vergeudet. // Tom squandered his entire inheritance.  →  Sie hat eine Erbschaft bekommen. // She received an inheritance.
- **Honig** `ex`: Er schmiert seinem Chef Honig um den Bart. // He's buttering up his boss.  →  Ich nehme Honig statt Zucker im Tee. // I take honey instead of sugar in my tea.
- **Bier** `ex`: Wir reisten nach Belgien des Bieres wegen. // We went to Belgium for the beer.  →  Ich trinke gern ein Bier nach der Arbeit. // I like to have a beer after work.
- **Hunger** `ex`: Die Flüchtlinge kämpften gegen den Hunger. // The refugees struggled against hunger.  →  Ich habe großen Hunger. // I am very hungry.
- **Koffein** `ex`: Warum hilft Coffein gegen Kopfschmerzen? // Why does caffeine help headaches?  →  Kaffee enthält viel Koffein. // Coffee contains a lot of caffeine.
- **Pfirsich** `ex`: Die Haut eines Pfirsichs ist verletztlich. // The skin of peaches bruises easily.  →  Die Haut eines Pfirsichs ist sehr empfindlich. // The skin of a peach is very delicate.
- **Haut** `ex`: Ich würde nicht gern in Toms Haut stecken. // I wouldn't like to be in Tom's shoes.  →  Meine Haut ist sehr trocken. // My skin is very dry.
- **Nerv** `ex`: Mir geht Toms Art zu reden auf die Nerven. // Tom's way of talking gets on my nerves.  →  Der Zahnarzt behandelt den Nerv. // The dentist is treating the nerve.
- **Tätowierung** `ex`: Was hältst du von Toms neuer Tätowierung? // What do you think of Tom's new tattoo?  →  Sie hat eine Tätowierung am Arm. // She has a tattoo on her arm.
- **Finger** `ex`: Das hat mir mein kleiner Finger erzählt. // A little bird told me.  →  Ich habe mir den Finger verletzt. // I hurt my finger.
- **Nase** `ex`: Er hat die Nase voll von meinen Problemen. // He is fed up with my problems.  →  Meine Nase ist verstopft. // My nose is blocked.
- **Gesicht** `ex`: Deinetwegen habe ich das Gesicht verloren. // You really made me lose face.  →  Sie wäscht sich das Gesicht. // She is washing her face.
- **Herz** `ex`: Sie schüttete ihren Freunden ihr Herz aus. // She unburdened her heart to her friends.  →  Mein Herz schlägt sehr schnell. // My heart is beating very fast.
- **vertragen** `ex`: Ich könnte jetzt ein kühles Bier vertragen. // I could do with a cold beer.  →  Ich vertrage keine Milch. // I cannot tolerate milk.
- **klinisch** `ex`: Quantitative klinische Daten folgen einem breiten Spektrum an Verteilungen. // Quantitative clinical data follow a wide range of distributions.  →  Die Ärzte machen eine klinische Studie. // The doctors are running a clinical study.
- **warm** `ex`: Ich zahle 800 € warm für meine Wohnung. // I pay €800 for my apartment, including utilities.  →  Im Sommer ist es hier sehr warm. // It is very warm here in summer.
- **heiß** `ex`: Was ich nicht weiß, macht mich nicht heiß. // Ignorance is bliss.  →  Das Wasser ist sehr heiß. // The water is very hot.
- **Himmel** `ex`: Es kam wie ein Blitz aus heiterem Himmel. // It was like a bolt out of the blue.  →  Der Himmel ist heute blau. // The sky is blue today.
- **Gras** `ex`: Beim Nachbarn ist das Gras immer grüner. // The grass is always greener on the other side.  →  Die Kinder spielen im Gras. // The children are playing in the grass.
- **Stein** `ex`: Wer ohne Sünde ist, werfe den ersten Stein. // Let him who is without sin cast the first stone.  →  Er wirft einen Stein ins Wasser. // He throws a stone into the water.
- **Windmühle** `ex`: Ich weiß, dass ich gegen Windmühlen kämpfe. // I know I'm fighting against windmills.  →  Die alte Windmühle steht auf dem Hügel. // The old windmill stands on the hill.
- **fruchtbar** `ex`: Unsere Zusammenarbeit ist fruchtbar gewesen. // Our collaboration was fruitful.  →  Der Boden hier ist sehr fruchtbar. // The soil here is very fertile.
- **Wasserfall** `ex`: Fyodor hat den schönen Wasserfall gesehen. // Fyodor saw the beautiful waterfall.  →  Wir haben einen großen Wasserfall gesehen. // We saw a big waterfall.
- **Mond** `ex`: Ganymed ist der größte Mond des Sonnensystems. // Ganymede is the biggest moon of the Solar System.  →  Der Mond scheint hell. // The moon is shining brightly.
- **Wolf** `ex`: Zwei Schafe wurden von einem Wolf getötet. // Two sheep were killed by a wolf.  →  Der Wolf heult nachts im Wald. // The wolf howls in the forest at night.
- **Maus** `ex`: Diese Maus wurde von meiner Katze getötet. // This mouse was killed by my cat.  →  Eine kleine Maus sitzt im Garten. // A little mouse is sitting in the garden.
- **Huhn** `ex`: Auch ein blindes Huhn findet mal ein Korn. // Even a broken clock is right twice a day.  →  Das Huhn legt jeden Tag ein Ei. // The hen lays an egg every day.
- **Fuchs** `ex`: Unser Paul ist ja ein kleiner Fuchs. // Our Paul is a little redhead.  →  Der Fuchs läuft durch den Wald. // The fox is running through the forest.
- **Elefant** `ex`: Er macht aus einer Mücke einen Elefanten. // He makes a mountain out of a molehill.  →  Der Elefant ist das größte Landtier. // The elephant is the largest land animal.
- **Mücke** `ex`: Du machst aus einer Mücke einen Elefanten. // You're making a big fuss about nothing.  →  Eine Mücke hat mich gestochen. // A mosquito bit me.
- **Wal** `ex`: Wirf eine Sprotte, um einen Wal zu fangen. // Throw a sprat to catch a whale.  →  Der Wal ist das größte Tier der Welt. // The whale is the largest animal in the world.
- **Anzug** `ex`: Die feindlichen Truppen sind im Anzug. // The enemy troops are approaching.  →  Er trägt einen dunklen Anzug. // He is wearing a dark suit.
- **Kragen** `ex`: Die bringen sich noch um Kopf und Kragen! // They're going to get themselves killed.  →  Sein Kragen ist zu eng. // His collar is too tight.
- **Hausschuh** `ex`: Er schlug mich sogar mit einem Hausschuh. // He even hit me with a slipper.  →  Zu Hause trage ich Hausschuhe. // At home I wear slippers.
- **ausziehen** `ex`: Herr Müller ist vor einer Woche ausgezogen. // Mr. Müller moved out a week ago.  →  Zieh bitte deine Schuhe aus. // Please take off your shoes.
- **Frau** `ex`: Ich habe letztes Jahr meine Frau verloren. // I lost my wife last year.  →  Meine Frau arbeitet im Krankenhaus. // My wife works in a hospital.
- **Ehemann** `ex`: Sie war verzweifelt, als ihr Ehemann starb. // She was in despair when her husband died.  →  Ihr Ehemann arbeitet als Arzt. // Her husband works as a doctor.
- **Mami** `ex`: Sie ist nicht meine Oma, sondern meine Mami. // She's not my grandma; she's my mom.  →  Meine Mami kocht heute das Essen. // My mom is cooking dinner today.
- **Heirat** `ex`: Ich habe nie auf eine Heirat hingedeutet. // I have never alluded to marriage.  →  Die Heirat findet im Mai statt. // The wedding takes place in May.
- **wandern** `ex`: Lassen Sie Ihren Gedanken einfach wandern. // Just let your thoughts wander.  →  Am Sonntag wandern wir im Wald. // On Sunday we are going hiking in the forest.
- **Spaziergang** `ex`: Dieser Kampf wird für ihn kein Spaziergang. // This fight won’t be a walk in the park for him.  →  Wir machen einen Spaziergang im Park. // We are taking a walk in the park.
- **herausfordern** `ex`: Ich will nicht das Schicksal herausfordern. // I don't want to tempt fate.  →  Er fordert mich zu einem Spiel heraus. // He challenges me to a game.
- **joggen** `ex`: Sie hat sich wieder in Form gejoggt. // She jogged herself back into shape.  →  Ich jogge jeden Morgen im Park. // I jog in the park every morning.
- **Tor** `ex`: Dieses Tor erlaubt einen Zugang zum Garten. // This gate allows access to the garden.  →  Der Spieler schießt ein Tor. // The player scores a goal.
- **Flug** `ex`: Toms Flug wurde um drei Stunden verschoben. // Tom's flight was postponed for three hours.  →  Mein Flug geht um acht Uhr. // My flight leaves at eight o'clock.
- **Kapitän** `ex`: Yoko ist Kapitän der Volleyballmannschaft. // Yoko is the captain of the volleyball team.  →  Der Kapitän steht auf der Brücke. // The captain is standing on the bridge.
- **Ausstieg** `ex`: Einstieg und Ausstieg aus einem Flugzeug. // Embarkation and disembarkation from an airplane.  →  Der Ausstieg ist hinten rechts. // The exit is at the back on the right.
- **Parkplatz** `ex`: Wir fanden keinen Parkplatz auf dem Parkplatz. // We couldn’t find a parking space in the car park.  →  Hier gibt es keinen freien Parkplatz. // There is no free parking space here.
- **Einkaufszentrum** `ex`: Layla und Sami fahren zum Einkaufszentrum. // Layla and Sami are going to the mall.  →  Wir fahren zum Einkaufszentrum. // We are going to the shopping center.
- **Motorrad** `ex`: Tims Motorrad ist weitaus teurer als meins. // Tim's motorbike is far more expensive than mine is.  →  Mein Motorrad ist sehr schnell. // My motorcycle is very fast.
- **Brunnen** `ex`: Er ist wie ein Frosch in einem Brunnen. // He is like a frog in a well.  →  Im Park gibt es einen Brunnen. // There is a fountain in the park.
- **Licht** `ex`: Kelly brachte Licht in die Angelegenheit. // Kelly brought the matter to light.  →  Mach bitte das Licht an. // Please turn on the light.
- **Wand** `ex`: Dort ist ein Portrait von Bob an der Wand. // There is a portrait of Bob on the wall.  →  An der Wand hängt ein Bild. // A picture is hanging on the wall.
- **Dach** `ex`: Das mit dem roten Dach dort ist Toms Haus. // That's Tom's house with the red roof.  →  Das Haus hat ein rotes Dach. // The house has a red roof.
- **Wohnzimmer** `ex`: Miho war im Wohnzimmer, als ich sie besuchte. // Miho was in the living room when I visited her.  →  Wir sitzen im Wohnzimmer. // We are sitting in the living room.
- **aufwischen** `ex`: Schnapp dir einen Fetzen und hilf mir, diesen Saustall aufzuwischen! // Grab a rag and help me clean up this mess.  →  Ich wische den Boden auf. // I am wiping the floor.
- **Tafel** `ex`: Anne hat etwas auf die Tafel geschrieben. // Ann wrote something on the blackboard.  →  Der Lehrer schreibt etwas an die Tafel. // The teacher is writing something on the blackboard.
- **lesen** `ex`: Das liest sich fast wie ein Abenteuerroman. // This almost reads like an adventure novel.  →  Ich lese jeden Abend ein Buch. // I read a book every evening.
- **Schuld** `ex`: Wer wird für diese Schulden aufkommen? // Who will pay for these debts?  →  Es ist nicht meine Schuld. // It is not my fault.
- **rechnen** `ex`: Damit haben die Fans nicht gerechnet. // Here's something fans never thought they'd see.  →  Ich rechne die Kosten aus. // I am calculating the costs.
- **Strafe** `ex`: Teenager sind Gottes Strafe fürs Sexhaben. // Teenagers are God's punishment for having sex.  →  Die Strafe war sehr hoch. // The punishment was very high.
- **Richter** `ex`: Die Öffentlichkeit ist der beste Richter. // The public is the best judge.  →  Der Richter spricht das Urteil. // The judge pronounces the verdict.
- **stehlen** `ex`: Sogar eine Nadel zu stehlen ist eine Sünde. // It is a sin to steal even a pin.  →  Er hat mein Fahrrad gestohlen. // He stole my bicycle.
- **verdächtig** `ex`: Die Verdächtige ist eine hellhäutige Frau. // The suspect is a caucasian female.  →  Der Mann sieht verdächtig aus. // The man looks suspicious.
- **Verbindung** `ex`: Freundschaft ist die Verbindung der Seelen. // Friendship is the connection of souls.  →  Die Verbindung ist schlecht. // The connection is bad.
- **programmieren** `ex`: Leon war darauf programmiert, das zu sagen. // Leon was programmed to say that.  →  Er programmiert eine neue App. // He is programming a new app.
- **Drohne** `ex`: Skura kaufte eine Drohne. // Skura bought a drone.  →  Die Drohne fliegt über dem Park. // The drone is flying over the park.
- **fotografieren** `ex`: Sara hat den Berg im Sommer fotografiert. // Sara took pictures of that mountain in summer.  →  Ich fotografiere gern Blumen. // I like photographing flowers.
- **Zeitschrift** `ex`: Sie leihen sich Zeitschriften von Taninna. // They borrow magazines from Taninna.  →  Ich lese jede Woche eine Zeitschrift. // I read a magazine every week.
- **poetisch** `ex`: Berberisch ist eine sehr poetische Sprache. // Berber is a pretty poetic language.  →  Das Gedicht klingt sehr poetisch. // The poem sounds very poetic.
- **Waffe** `ex`: Er wurde mit einer stumpfen Waffe getötet. // He was killed by a blunt weapon.  →  Er trägt keine Waffe. // He is not carrying a weapon.
- **Freiheit** `ex`: Keine Freiheit für die Feinde der Freiheit. // No liberty for the enemies of liberty.  →  Freiheit ist wichtig für mich. // Freedom is important to me.
- **Reform** `ex`: Ich protestiere gegen diese dumme Reform! // I protest against this stupid reform!  →  Die Reform kommt nächstes Jahr. // The reform is coming next year.
- **jetzt** `ex`: Ihr Bruder Kensaku ist jetzt in Brasilien. // Her brother Kensaku is now in Brazil.  →  Ich bin jetzt zu Hause. // I am at home now.
- **noch** `ex`: Nur noch ein Wunder kann sie jetzt retten. // Nothing but a miracle can save her now.  →  Ich habe noch Hunger. // I am still hungry.
- **allmählich** `ex`: Toms Japanisch verbessert sich allmählich. // Tom's Japanese is improving little by little.  →  Mein Deutsch wird allmählich besser. // My German is gradually getting better.
- **Sekunde** `ex`: Es bleiben dir nur zehn Sekunden zu leben. // You have only ten seconds left to live.  →  Eine Minute hat sechzig Sekunden. // A minute has sixty seconds.
- **Ortszeit** `ex`: Der Unterricht beginnt um 16 Uhr Ortszeit Rio de Janeiro (GMT −3). // The classes will start at 4:00 PM Rio de Janeiro Time (GMT -3).  →  Wir landen um 18 Uhr Ortszeit. // We land at 6 p.m. local time.
- **nerven** `ex`: Toms Art zu reden geht mir auf die Nerven. // Tom's way of speaking gets on my nerves.  →  Das Kind nervt mich. // The child is annoying me.
- **unverschämt** `ex`: Toms Forderungen wurden immer unverschämter. // Tom's demands became more and more outrageous.  →  Die Preise sind unverschämt. // The prices are outrageous.
- **griesgrämig** `ex`: Der griesgrämige Alte war Toms Großvater. // That grumpy old man was Tom's grandfather.  →  Er ist heute griesgrämig. // He is grumpy today.
- **froh** `ex`: Du wirst deines Lebens nicht mehr froh. // You will no longer be happy with your life.  →  Ich bin froh, dass du da bist. // I am glad you are here.
- **heiter** `ex`: Das kam wie ein Blitz aus heiterem Himmel. // This was a bolt from the blue.  →  Der Tag ist heiter und hell. // The day is cheerful and bright.
- **Neid** `ex`: Die Tochter des Neides ist die Verleumdung. // The daughter of envy is defamation.  →  Er spürt Neid auf seinen Bruder. // He feels envy of his brother.
- **mutig** `ex`: Obwohl sie ein Mädchen ist, ist sie mutig. // She's a girl, but she's brave.  →  Das war eine mutige Entscheidung. // That was a brave decision.
- **Trauer** `ex`: Krieg wird von Elend und Trauer begleitet. // Misery and sorrow accompany war.  →  In ihrer Trauer brach sie in Tränen aus. // In her grief she burst into tears.
- **besprechen** `ex`: Viviana hat wichtige Themen zu besprechen. // Viviana has important issues to discuss.  →  Wir besprechen den Plan. // We are discussing the plan.
- **Rede** `ex`: Sein Reden lenkte sie von ihrem Kummer ab. // His talk distracted her from grief.  →  Die Rede dauerte zehn Minuten. // The speech lasted ten minutes.
- **Sprecher** `ex`: Nicht-Muttersprachler sind auch Sprecher. // Non-native speakers are speakers, too.  →  Der Sprecher beginnt gleich. // The speaker is about to begin.
- **bitte** `ex`: Wenn Sie frei haben, bitte helfen Sie mir. // If you are free, give me a hand.  →  Kannst du mir bitte helfen? // Can you please help me?
- **Anweisung** `ex`: Meine Anweisung wirkte auf sie ermutigend. // My advice acted as an encouragement to her.  →  Bitte befolgen Sie die Anweisungen. // Please follow the instructions.
- **sehen** `ex`: Peter sieht, dass das Garagentor offen ist. // Peter sees that the garage door is open.  →  Ich sehe einen Vogel. // I see a bird.
- **schlagen** `ex`: Ich schlug zwei Fliegen mit einer Klappe. // I killed two birds with one stone.  →  Er schlägt den Ball. // He hits the ball.
- **aufstehen** `ex`: Wir sind auf dem falschen Fuß aufgestanden. // We got off on the wrong foot.  →  Ich stehe um sieben Uhr auf. // I get up at seven o'clock.
- **stehen** `ex`: Welche Zahlungsarten stehen zur Verfügung? // What payment options are available?  →  Das Auto steht vor dem Haus. // The car is standing in front of the house.
- **nehmen** `ex`: Die Niederlage nahm der Mannschaft den Mut. // The team's defeat robbed them of their courage.  →  Ich nehme den Bus. // I take the bus.
- **werfen** `ex`: Das Flugzeug warf Bomben auf die Stadt ab. // The plane dropped bombs on the city.  →  Er wirft den Ball. // He throws the ball.
- **aufgeben** `ex`: Er ging zur Post, um den Brief aufzugeben. // He went to the post office to mail the letter.  →  Ich gebe nie auf. // I never give up.
- **steigen** `ex`: Die Party im Club steigt heute um 19 Uhr. // The party in the club is happening tonight at 7 pm.  →  Die Temperatur steigt. // The temperature is rising.
- **passieren** `ex`: Die Gruppe hat soeben die Grenze passiert. // The group has just passed the border.  →  Was ist passiert? // What happened?
- **schaffen** `ex`: Warum hat Gott die Welt geschaffen? // Why did God create the world?  →  Ich schaffe das! // I can do it!
- **cool** `ex`: Als Trainer muss mann ziemlich cool sein. // As a trainer you have to be quite easy-going.  →  Das ist ein cooles Auto. // That is a cool car.
- **einzig** `ex`: Er wurde durch eine einzige Kugel getötet. // He was killed by a single bullet.  →  Das ist die einzige Lösung. // That is the only solution.
- **stark** `ex`: Was mich nicht umbringt, macht mich stärker. // What doesn't kill you makes you stronger.  →  Er ist sehr stark. // He is very strong.
- **böse** `ex`: Böse Kinder kriegen nichts vom Sankt Nikolaus. // Naughty children don’t get anything from St. Nicholas.  →  Der Hund ist nicht böse. // The dog is not mean.
- **schwach** `ex`: Tante Yoko ist zu schwach, um zu arbeiten. // Aunt Yoko is too weak to work.  →  Ich fühle mich heute schwach. // I feel weak today.
- **ähnlich** `ex`: Sie ist mir ähnlich. / Sie ist ähnlich wie ich. // She is similar to me.  →  Die Brüder sind sich sehr ähnlich. // The brothers are very similar.
- **behutsam** `ex`: Seine Anweisung ist immer sehr behutsam. // His advice is always very sensible.  →  Wir gehen behutsam vor. // We proceed carefully.
- **brutal** `ex`: Der Aufstand wurde brutal niedergeschlagen. // The uprising was brutally suppressed.  →  Der Film war sehr brutal. // The film was very brutal.
- **Dienst** `ex`: Helen hat mir einen guten Dienst erwiesen. // Helen did me a good turn.  →  Der Dienst beginnt um sieben Uhr. // The shift begins at seven o'clock.
- **Assistent** `ex`: Kennen Sie den Namen von Toms Assistenten? // Do you know Tom's assistant's name?  →  Mein Assistent arbeitet heute von zu Hause. // My assistant is working from home today.
- **Chefin** `ex`: Unsere Chefin fand Toms Spaß nicht zum Lachen. // Our boss didn't find Tom's practical joke funny.  →  Unsere Chefin ist sehr freundlich. // Our boss is very friendly.
- **entlassen** `ex`: Er wurde aus dem Gefängnis entlassen. // He was released from prison.  →  Die Firma entlässt zehn Mitarbeiter. // The company is laying off ten employees.
- **Wüste** `ex`: Lass mich nicht hier in der Wüste im Stich! // Don't desert me here in the desert!  →  Die Sahara ist die größte Wüste der Welt. // The Sahara is the biggest desert in the world.
- **Bauernhof** `ex`: Sie setzten Häuser und Bauernhöfe in Brand. // They set fire to houses and farm buildings.  →  Der Bauernhof liegt am Dorfrand. // The farm is on the edge of the village.
- **Treibhausgas** `ex`: China produziert noch zu viele Treibhausgase. // China still produces too many GHG.  →  Methan ist ein Treibhausgas. // Methane is a greenhouse gas.
- **Erinnerung** `ex`: Wenn mich meine Erinnerung nicht trügt... // If my memory doesn’t fail me...  →  Ich habe schöne Erinnerungen an den Urlaub. // I have fond memories of the vacation.
- **schätzen** `ex`: Kannst du den Wert des Diamanten schätzen? // Can you guess the worth of the diamond?  →  Ich schätze deine Hilfe. // I appreciate your help.
- **Herkunft** `ex`: Meine Familie sind germanischer Herkunft. // My family are of Germanic heritage.  →  Ihre Herkunft ist unbekannt. // Her origin is unknown.
- **Konzept** `ex`: Die Existenz ist ein unwichtiges Konzept. // Existence is a meaningless concept.  →  Das Konzept ist gut durchdacht. // The concept is well thought out.
- **lösen** `ex`: Herr Thomas wird das Problem lösen können. // Mr. Thomas will be able to solve the problem.  →  Ich löse das Problem morgen. // I will solve the problem tomorrow.
- **scheinen** `ex`: Jane scheint einen neuen Freund zu haben. // Jane seems to have a new boyfriend.  →  Die Sonne scheint. // The sun is shining.
- **Zustand** `ex`: Ich habe das in betrunkenem Zustand getan. // I did it while I was drunk.  →  Das Haus ist in gutem Zustand. // The house is in good condition.
- **Form** `ex`: Ich fürchte, dass ich etwas außer Form bin. // I'm afraid I'm a bit out of shape.  →  Der Tisch hat eine runde Form. // The table has a round shape.
- **vielleicht** `ex`: Das is’ vielleicht’ne Geldverschwendung da! // Now, that’s some waste of money!  →  Vielleicht komme ich morgen. // Maybe I will come tomorrow.
- **kapieren** `ex`: Dieser Idiot kapiert rein gar nichts. // This idiot doesn’t understand a single thing.  →  Ich kapiere das nicht. // I do not get it.
- **Ausweg** `ex`: Er sah den Selbstmord als einzigen Ausweg. // He saw suicide as the only way out.  →  Es gibt noch einen anderen Ausweg. // There is another way out.
- **Maximum** `ex`: Beachte, dass das Maximum nicht immer existiert. // Note that the maximum doesn't always exist.  →  Das Maximum liegt bei hundert. // The maximum is one hundred.
- **werden** `ex`: Rom ist nicht an einem Tage erbaut worden. // Rome wasn't built in a day.  →  Es wird dunkel. // It is getting dark.
- **Abgeordneter** `ex`: Es ist ein Ausschuss Abgeordneter angekommen. // A committee of congressmen has arrived.  →  Die Abgeordneten stimmen im Parlament ab. // The members of parliament are voting in parliament.

## E. Tier (21)

- **Wolle** `tier`: 1  →  4
- **schick** `tier`: 2  →  4
- **Sage** `tier`: 1  →  5
- **Würde** `tier`: 1  →  5
- **Leid** `tier`: 1  →  5
- **gefallen** `tier`: 1  →  2
- **Glaube** `tier`: 1  →  3
- **Macht** `tier`: 1  →  3
- **schonen** `tier`: 1  →  4
- **sichern** `tier`: 1  →  5
- **platzen** `tier`: 2  →  4
- **fern** `tier`: 3  →  5
- **Ware** `tier`: 1  →  4
- **Straße** `tier`: 5  →  2
- **Fußball** `tier`: 6  →  2
- **Hausaufgabe** `tier`: 6  →  2
- **Größe** `tier`: 6  →  3
- **groß** `tier`: 5  →  1
- **Fliege** `tier`: 2  →  4
- **Herd** `tier`: 3  →  5
- **genießen** `tier`: 4  →  3

## F. Plural (22)

- **Reis** `plural`: Reise  →  (none)
- **Milch** `plural`: Milchen  →  (none)
- **Honig** `plural`: Honige  →  (none)
- **Blut** `plural`: Blute  →  (none)
- **Schlaf** `plural`: Schläfe  →  (none)
- **Erde** `plural`: Erden  →  (none)
- **Natur** `plural`: Naturen  →  (none)
- **Wolle** `plural`: Wollen  →  (none)
- **Unterwäsche** `plural`: Unterwäschen  →  (none)
- **Baumwolle** `plural`: Baumwollen  →  (none)
- **Schach** `plural`: Schachs  →  (none)
- **Post** `plural`: Posten  →  (none)
- **Streit** `plural`: Streite  →  (none)
- **Studium** `plural`: Studien  →  (none)
- **Schutz** `plural`: Schutze  →  (none)
- **Würde** `plural`: Würden  →  (none)
- **Landwirtschaft** `plural`: Landwirtschaften  →  (none)
- **Software** `plural`: Softwares  →  (none)
- **Politik** `plural`: Politiken  →  (none)
- **Januar** `plural`: Januare  →  (none)
- **Handel** `plural`: Händel  →  (none)
- **Dollar** `plural`: Dollars  →  Dollar

## G. Family words that are not family (15)

- **Untersuchung** `family-`: untersuchen,Suche  →  Suche
- **Unterkunft** `family-`: unterkommen,Kunft  →  Kunft
- **Ausstellung** `family-`: ausstellen,Stellung  →  Stellung
- **Zuständigkeit** `family-`: zuständig,Zustand  →  Zustand
- **Neugier** `family-`: neugierig,Gier  →  Gier
- **Zuversicht** `family-`: zuversichtlich,Versicht  →  Versicht
- **behaupten** `family-`: Behauptung,haupt  →  haupt
- **holen** `family-`: abholen,Holz  →  Holz
- **suchen** `family-`: Suche,besuchen  →  besuchen
- **selten** `family-`: Seltenheit,seltsam  →  seltsam
- **bequem** `family-`: Bequemlichkeit,quem  →  quem
- **beiläufig** `family-`: beilaufen,Beiläufigkeit  →  beilaufen
- **Recycling** `family-`: recyceln,Zyklus  →  Zyklus
- **Schiedsrichter** `family-`: schiedlich,Richter  →  schiedlich
- **Ungeziefer** `family>`: Zieferbekämpfung,Schädling  →  Zieferbekämpfung>Ungezieferbekämpfung

## H. Lemma form (adjective nouns, spelling) (5)

- **Erwachsener** `lemma`: Erwachsener  →  Erwachsene
- **Angestellter** `lemma`: Angestellter  →  Angestellte
- **Verdächtiger** `lemma`: Verdächtiger  →  Verdächtige
- **Abgeordneter** `lemma`: Abgeordneter  →  Abgeordnete
- **Nachtklub** `lemma`: Nachtklub  →  Nachtclub

## I. Remove the word (6)

- **Gym** `remove`: das Gym  →  (none)
- **Baseballspiel** `remove`: das Baseballspiel  →  (none)
- **Grabstein** `remove`: der Grabstein  →  (none)
- **Zement** `remove`: der Zement  →  (none)
- **garen** `remove`:  garen  →  (none)
- **Rekordhalter** `remove`: der Rekordhalter  →  (none)

## K. Translation of the example (1)

- **Karriere** `exen`: It was never important to her to get a promotion.  →  Making a career was never important to her.

