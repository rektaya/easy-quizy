#!/usr/bin/env python3
"""Step 1b: words chosen by theme (the frequency list gives plenty of everyday verbs and adjectives but few
topic words). The author's picks per theme are looked up in Wiktionary like the others; the tier still comes
from the frequency list. Appended to data-sources/picked.json with the theme already set.
"""
import json, os, re, sys
sys.path.insert(0, os.path.dirname(__file__))
from pick_lemmas import DATA, existing_lemmas, resolve, tier_of

WISH = {
 1: "Butter Käse Ei Apfel Kartoffel Tomate Zucker Salz Suppe Nudel Fisch Wurst Salat Bier Wein Tee Saft Hunger Durst Mittagessen Abendessen Teller Löffel Gabel backen braten Schokolade Honig Zitrone Sahne Pfeffer Birne Erdbeere Karotte Zwiebel Gurke Pilz Reis",
 2: "Hals Rücken Bauch Auge Ohr Nase Mund Zahn Haut Blut Fieber Husten Erkältung Apotheke Tablette Krankenhaus Medikament Verband Spritze Schlaf schlafen müde gesund Knochen Muskel Lunge Magen Finger Bein Arm Gesicht Haar",
 3: "Regen Schnee Wind Sonne Wolke Gewitter Nebel Sturm Frost Eis Wald Berg See Meer Wiese Baum Blume Gras Blatt Stein Sand Tal Hügel Insel Jahreszeit Frühling Sommer Herbst Winter Temperatur Blitz Donner Wetter Pflanze Wasserfall Ufer Gipfel",
 4: "Hund Katze Pferd Kuh Schwein Schaf Huhn Vogel Maus Hase Fuchs Löwe Elefant Affe Schlange Frosch Biene Fliege Spinne Ente Taube Eule Adler Hirsch Ziege Esel Käfer Schmetterling Ameise Delfin Hai Tier Tiger Krokodil Wal Igel Eichhörnchen Hummel Mücke Ratte Gans Pinguin",
 5: "Hemd Hose Jacke Mantel Kleid Rock Schuh Socke Mütze Schal Handschuh Pullover Anzug Krawatte Gürtel Tasche Brille Ring Uhr anziehen ausziehen tragen Stiefel Bluse Unterwäsche Badeanzug Sandale Stoff Baumwolle Größe Knopf Reißverschluss Kragen Ärmel Hut Regenschirm",
 6: "Mutter Vater Bruder Schwester Sohn Tochter Oma Eltern Kind Baby Enkel Cousin Nachbar Freundin Ehe Hochzeit Geburtstag Verwandte Ehemann Ehefrau Schwiegermutter Zwilling Freund Familie Partner",
 7: "Fußball Schwimmen wandern Radfahren Spaziergang Ball Spiel Mannschaft Training Sport Hobby Konzert Kino Theater Museum Wettkampf Turnier Gewinner Schach angeln Camping tanzen Tor Schiedsrichter Stadion Fitnessstudio joggen",
 8: "Flughafen Bahnhof Zug Bus Ticket Koffer Hotel Reise Reisepass Visum Zoll Fahrplan Gleis Abfahrt Ankunft Verspätung Taxi Fähre Landkarte Urlaub Rucksack Gepäck Tourist Ausflug Übernachtung Buchung Flugzeug Schiff Hafen Auskunft Reiseführer",
 9: "Straße Brücke Ampel Kreuzung Geschäft Supermarkt Markt Bäckerei Post Bank Rathaus Park Haltestelle Bürgersteig Hochhaus Einkaufszentrum Laden Kasse Schaufenster Verkehr Stau Parkplatz Fahrrad Motorrad Stadtplan Stadtmitte Denkmal Brunnen Bibliothek Café Metzger Blumenladen",
 10: "Tür Fenster Wand Dach Treppe Keller Schlafzimmer Wohnzimmer Badezimmer Tisch Stuhl Bett Schrank Sofa Regal Spiegel Teppich Vorhang Schlüssel Miete Vermieter Heizung Steckdose Dusche Waschmaschine Kühlschrank Herd Kerze Balkon Decke Kissen Lampe Boden",
 11: "Lehrer Schüler Student Universität Prüfung Note Hausaufgabe Heft Stift Buch Unterricht Fach Zeugnis Kurs Wörterbuch Schulhof Studium Abitur lernen lesen Tafel Klassenzimmer Stundenplan Kindergarten Referat Abschluss",
 12: "Geld Konto Bargeld Münze Preis Kosten Gehalt Lohn Steuer Schuld Kredit Versicherung sparen bezahlen Quittung Euro Cent Gewinn Verlust Vermögen reich arm Geldbeutel Überweisung Zinsen Kreditkarte Bankautomat",
 13: "Gesetz Gericht Richter Anwalt Polizei Vertrag Strafe Verbrechen Dieb Zeuge Urteil Antrag Formular Genehmigung Ausweis Amt Behörde Gebühr Frist Klage Beweis Unterschrift Verbot Erlaubnis Verfahren Staatsanwalt",
 14: "Computer Internet Handy Bildschirm Tastatur Passwort Datei Programm Nachricht Netzwerk Server Webseite herunterladen Speicher Akku Kamera Drucker Software Hacker Drohne Laptop Tablet Maus Konto Suchmaschine Foto Video",
 15: "Zeitung Fernsehen Nachrichten Film Musik Lied Sänger Roman Gedicht Bild Gemälde Ausstellung Künstler Zeitschrift Interview Sendung Kanal Werbung Journalist Fernseher Serie Schauspieler Oper Bühne Autor Zeichnung",
 16: "Regierung Partei Wahl Präsident Kanzler Parlament Minister Bürger Demokratie Gesellschaft Krieg Frieden Freiheit Staat Land Politik Mehrheit Demonstration Protest Reform Recht Armee Grenze Verfassung Abgeordneter",
 17: "Woche Monat Jahr Stunde Minute Sekunde Datum Kalender Termin Wochenende Feiertag Mitternacht Mittag Abend Nacht gestern Zukunft Vergangenheit spät bald Jahrhundert Zeit Montag Sonntag Januar Dezember Geburtstag",
 18: "Angst Freude Wut Trauer Hoffnung Liebe Stolz Neid Sorge Mut Geduld ehrlich mutig schüchtern eifersüchtig traurig glücklich",
 22: "Firma Chef Kollege Bewerbung Lebenslauf Kunde Verkauf Produktion Handel Unternehmen Angestellter Arbeitgeber Arbeitslosigkeit Streik Besprechung Maschine Werkzeug Handwerker Bauer Fabrik Gehalt Vertrag Bewerber Praktikum",
 23: "Umwelt Klima Energie Strom Gas Öl Kohle Windkraft Abfall Müll Recycling Verschmutzung Luft Naturschutz Erderwärmung Treibhausgas Atomkraft Kraftwerk Batterie Solaranlage Rohstoff Plastik Überschwemmung Dürre Ernte Landwirtschaft Bauernhof Dünger Wasser Wüste Regenwald Gletscher Artenschutz",
}

def main():
    path = os.path.join(DATA, 'picked.json')
    picked = json.load(open(path, encoding='utf8'))
    have = existing_lemmas() | {w['lemma'].casefold() for w in picked}
    freq = {}
    for i, line in enumerate(open(os.path.join(DATA, 'de_50k.txt'), encoding='utf8')):
        freq.setdefault(line.split()[0], i + 1)
    added, missed = [], []
    for theme, words in WISH.items():
        for lemma in words.split():
            if lemma.casefold() in have:
                continue
            recs = [r for r in resolve(lemma) if r['lemma'] == lemma]
            want_noun = lemma[0].isupper()
            recs = [r for r in recs if (r['pos'] == 'noun') == want_noun] or recs
            if not recs:
                missed.append(lemma)
                continue
            r = recs[0]
            ranks = [freq[f.casefold()] for f in r['forms'] if f.casefold() in freq]
            rank = min(ranks) if ranks else 60000
            r['rank'], r['tier'], r['theme'], r['extra'] = rank, tier_of(rank), theme, True
            picked.append(r)
            have.add(lemma.casefold())
            added.append(lemma)
    json.dump(picked, open(path, 'w', encoding='utf8'), ensure_ascii=False, indent=1)
    print('added', len(added), 'not found:', len(missed), missed[:40])

if __name__ == '__main__':
    main()
