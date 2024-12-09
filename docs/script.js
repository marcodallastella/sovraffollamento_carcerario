async function fetchCSV(url) {
  const response = await fetch(url);
  const data = await response.text();
  return data.split('\n').map(row => row.trim()).filter(row => row !== '');
}

function formatDate(dateString, locale = 'it-IT') {
  if (!dateString) {
    console.error('Invalid date string:', dateString);
    return ''; // Return an empty string or a default value as needed
  }
  const [year, month, day] = dateString.split('-');
  const date = new Date(year, month - 1, day);
  return date.toLocaleDateString(locale, { day: 'numeric', month: 'long', year: 'numeric' });
}

function formatNumber(numberString, locale = 'it-IT') {
  const sanitizedNumber = numberString.replace(/\./g, '').replace(',', '.');
  const parsedNumber = parseInt(sanitizedNumber, 10); // Parse as integer
  console.log('Parsed Number:', parsedNumber); // Debugging step
  return parsedNumber.toLocaleString(locale); // Format the integer
}

async function fetchData() {
  // Fetch main CSV (bulletines_totals.csv)
  const bulletinesRows = await fetchCSV('https://raw.githubusercontent.com/marcodallastella/prison_overcrowding/refs/heads/main/outputs/viz/bulletines_totals.csv');
  const lastBulletinRow = bulletinesRows[bulletinesRows.length - 1].split(',');
  console.log('Tasso di sovraffollamento (raw):', lastBulletinRow[lastBulletinRow.length - 1]);

  // Format data from the last row
  const lastUpdateDate = lastBulletinRow[0].trim();
  // const formattedDate = formatDate(lastUpdateDate);
  // const detaineesCount = formatNumber(lastBulletinRow[lastBulletinRow.length - 4]);
  // const capacity = formatNumber(lastBulletinRow[lastBulletinRow.length - 5]);
  
  // Correctly parse the overcrowding rate
  const rawOvercrowdingRate = parseFloat(lastBulletinRow[lastBulletinRow.length - 1].replace(',', '.')); // Replace comma with dot for parsing
  // const formattedOvercrowdingRate = rawOvercrowdingRate.toLocaleString('it-IT', { minimumFractionDigits: 0, maximumFractionDigits: 2 });

  // Update HTML with detainees data
  // document.getElementById('detainees-count').innerText = `${detaineesCount}`;
  // document.getElementById('capacity-count').innerText = `a fronte di ${capacity} posti regolamentari.`;
  // document.getElementById('last-update').innerText = `Al ${formattedDate} i detenuti presenti in Italia erano`;
  // document.getElementById('last-update-bollettini').innerText = `${formattedDate}`;
  // document.getElementById('overcrowding-rate').innerText = `Ufficialmente, nelle carceri italiane ci sono quindi ${formattedOvercrowdingRate} persone ogni 100 posti disponibili.`;

  // Fetch third CSV (institutes_most_recent.csv)
  const recentInstitutesRows = await fetchCSV('https://raw.githubusercontent.com/marcodallastella/prison_overcrowding/refs/heads/main/outputs/viz/institutes_most_recent.csv');
  const headers3 = recentInstitutesRows[0].split(',');
  const lastRecentRow = recentInstitutesRows[recentInstitutesRows.length - 2].split(',');

  const lastUpdateInstitutes = lastRecentRow[headers3.indexOf('dati aggiornati al')];
  console.log('lastUpdateInstitutes:', lastUpdateInstitutes);
  const formattedDate2 = formatDate(lastUpdateInstitutes);

  // Find the highest overcrowding rate and count overcrowded prisons
  let highestAffollamento = 0;
  let highestAffollamentoNome = '';
  let overcrowdedPrisonCount = 0;

  for (let i = 1; i < recentInstitutesRows.length - 1; i++) {
      const row = recentInstitutesRows[i].split(',');
      const currentAffollamento = parseFloat(row[headers3.indexOf('tasso di affollamento')].replace(',', '.'));

      if (currentAffollamento > highestAffollamento) {
          highestAffollamento = currentAffollamento;
          highestAffollamentoNome = row[headers3.indexOf('nome istituto')];
      }

      if (currentAffollamento >= 150) {
          overcrowdedPrisonCount++;
      }
  }

  // Update HTML with highest overcrowding and prison count
  const formattedHighestAffollamento = highestAffollamento.toLocaleString('it-IT', { minimumFractionDigits: 0 });
  document.getElementById('highest-overcrowding').innerText = `La situazione più grave si registra a ${highestAffollamentoNome}, dove il sovraffollamento è del ${formattedHighestAffollamento}%.`;
  document.getElementById('overcrowded-prisons-count').innerText = `La realtà però è spesso peggiore. In ben ${overcrowdedPrisonCount} istituti penitenziari il tasso di affollamento è pari o superiore al 150% (tre persone ogni due posti disponibili!).`;
  document.getElementById('last-update-istituti').innerText = `${formattedDate2}`;

  // Fetch second CSV (institutes_totals.csv)
  const institutesRows = await fetchCSV('https://raw.githubusercontent.com/marcodallastella/prison_overcrowding/refs/heads/main/outputs/viz/institutes_totals.csv');
  const headers2 = institutesRows[0].split(',');
  const lastInstituteRow = institutesRows[institutesRows.length - 1].split(',');
  
  // Correctly parse the latest overcrowding rate and unavailable places
  const latestOvercrowdingRate = parseFloat(lastInstituteRow[headers2.indexOf('tasso di affollamento')]).toLocaleString('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const unavailablePlaces = parseInt(lastInstituteRow[headers2.indexOf('posti non disponibili')], 10).toLocaleString('it-IT');
  const totalDetainees = parseInt(lastInstituteRow[headers2.indexOf('totale detenuti')], 10).toLocaleString('it-IT');
  const availablePlacesRecent = parseInt(lastInstituteRow[headers2.indexOf('posti regolamentari')], 10).toLocaleString('it-IT');



  // // Update HTML with additional data
  // document.getElementById('recent-overcrowding-rate').innerText = `e il reale tasso di sovraffollamento ${latestOvercrowdingRate}%.`;
  // document.getElementById('unavailable-places').innerText = `Ma si tratta di una stima al ribasso, poiché questo dato non tiene conto dei posti che, per un motivo o perl l'altro, non sono disponibili. Al ${formattedDate2}, questi erano ${unavailablePlaces}`;
  document.getElementById('total-detainees').innerText = `Al ${formattedDate2}, in Italia sono ${totalDetainees} le persone detenute. Questo numero è già di per sé superiore alla "capienza regolaentare" delle carceri italiani, corrispondente a,  ${availablePlacesRecent} posti. Si tratta però di posti puramente teorici, calcolati sulla base dei criteri di abilità. In realtà, in ${unavailablePlaces} casi questi posti non sono, per un motivo o per l'altro. Questo fa sì che il tasso di affollamento reale sia del ${latestOvercrowdingRate}%.`;

  
}

window.onload = fetchData;