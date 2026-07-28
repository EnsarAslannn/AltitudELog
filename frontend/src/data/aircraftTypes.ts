/**
 * Broad airframe families, used to pick a silhouette. Deliberately coarse: a category is
 * still correct when the exact variant isn't recognised, which matters because the aircraft
 * type field is free text (the API only length-checks it) and any code can arrive here.
 */
export type AircraftCategory =
  | 'widebody'
  | 'narrowbody'
  | 'regional'
  | 'turboprop'
  | 'piston'
  | 'bizjet'
  | 'helicopter'
  | 'unknown'

export interface AircraftType {
  code: string
  label: string
  category: AircraftCategory
}

// Curated list of common commercial, regional/GA, and business-jet types.
// Not exhaustive — users can still type any aircraft type not listed here.
export const aircraftTypes: AircraftType[] = [
  // Airbus narrow/wide-body
  { code: 'A318', label: 'Airbus A318', category: 'narrowbody' },
  { code: 'A319', label: 'Airbus A319', category: 'narrowbody' },
  { code: 'A320', label: 'Airbus A320', category: 'narrowbody' },
  { code: 'A20N', label: 'Airbus A320neo', category: 'narrowbody' },
  { code: 'A321', label: 'Airbus A321', category: 'narrowbody' },
  { code: 'A21N', label: 'Airbus A321neo', category: 'narrowbody' },
  { code: 'A330', label: 'Airbus A330', category: 'widebody' },
  { code: 'A332', label: 'Airbus A330-200', category: 'widebody' },
  { code: 'A333', label: 'Airbus A330-300', category: 'widebody' },
  { code: 'A338', label: 'Airbus A330-800neo', category: 'widebody' },
  { code: 'A339', label: 'Airbus A330-900neo', category: 'widebody' },
  { code: 'A340', label: 'Airbus A340', category: 'widebody' },
  { code: 'A350', label: 'Airbus A350', category: 'widebody' },
  { code: 'A359', label: 'Airbus A350-900', category: 'widebody' },
  { code: 'A35K', label: 'Airbus A350-1000', category: 'widebody' },
  { code: 'A380', label: 'Airbus A380', category: 'widebody' },

  // Boeing narrow/wide-body
  { code: 'B734', label: 'Boeing 737-400', category: 'narrowbody' },
  { code: 'B737', label: 'Boeing 737', category: 'narrowbody' },
  { code: 'B738', label: 'Boeing 737-800', category: 'narrowbody' },
  { code: 'B739', label: 'Boeing 737-900', category: 'narrowbody' },
  { code: 'B38M', label: 'Boeing 737 MAX 8', category: 'narrowbody' },
  { code: 'B39M', label: 'Boeing 737 MAX 9', category: 'narrowbody' },
  { code: 'B747', label: 'Boeing 747', category: 'widebody' },
  { code: 'B748', label: 'Boeing 747-8', category: 'widebody' },
  { code: 'B757', label: 'Boeing 757', category: 'narrowbody' },
  { code: 'B767', label: 'Boeing 767', category: 'widebody' },
  { code: 'B777', label: 'Boeing 777', category: 'widebody' },
  { code: 'B77W', label: 'Boeing 777-300ER', category: 'widebody' },
  { code: 'B778', label: 'Boeing 777-8', category: 'widebody' },
  { code: 'B787', label: 'Boeing 787 Dreamliner', category: 'widebody' },
  { code: 'B788', label: 'Boeing 787-8', category: 'widebody' },
  { code: 'B789', label: 'Boeing 787-9', category: 'widebody' },
  { code: 'B78X', label: 'Boeing 787-10', category: 'widebody' },

  // Regional jets & turboprops
  { code: 'E170', label: 'Embraer E170', category: 'regional' },
  { code: 'E175', label: 'Embraer E175', category: 'regional' },
  { code: 'E190', label: 'Embraer E190', category: 'regional' },
  { code: 'E195', label: 'Embraer E195', category: 'regional' },
  { code: 'E290', label: 'Embraer E190-E2', category: 'regional' },
  { code: 'E295', label: 'Embraer E195-E2', category: 'regional' },
  { code: 'CRJ2', label: 'Bombardier CRJ200', category: 'regional' },
  { code: 'CRJ7', label: 'Bombardier CRJ700', category: 'regional' },
  { code: 'CRJ9', label: 'Bombardier CRJ900', category: 'regional' },
  { code: 'CRJX', label: 'Bombardier CRJ1000', category: 'regional' },
  { code: 'AT72', label: 'ATR 72', category: 'turboprop' },
  { code: 'AT42', label: 'ATR 42', category: 'turboprop' },
  { code: 'DH8D', label: 'Bombardier Dash 8 Q400', category: 'turboprop' },
  { code: 'SB20', label: 'Saab 2000', category: 'turboprop' },

  // General aviation — split by powerplant, since a turbine single and a piston single
  // read differently in silhouette even though both sit in this group.
  { code: 'C152', label: 'Cessna 152', category: 'piston' },
  { code: 'C172', label: 'Cessna 172 Skyhawk', category: 'piston' },
  { code: 'C182', label: 'Cessna 182 Skylane', category: 'piston' },
  { code: 'C206', label: 'Cessna 206 Stationair', category: 'piston' },
  { code: 'C208', label: 'Cessna 208 Caravan', category: 'turboprop' },
  { code: 'PA28', label: 'Piper PA-28 Cherokee', category: 'piston' },
  { code: 'PA34', label: 'Piper PA-34 Seneca', category: 'piston' },
  { code: 'PA44', label: 'Piper PA-44 Seminole', category: 'piston' },
  { code: 'DA40', label: 'Diamond DA40', category: 'piston' },
  { code: 'DA42', label: 'Diamond DA42 Twin Star', category: 'piston' },
  { code: 'DA62', label: 'Diamond DA62', category: 'piston' },
  { code: 'SR20', label: 'Cirrus SR20', category: 'piston' },
  { code: 'SR22', label: 'Cirrus SR22', category: 'piston' },
  { code: 'TB10', label: 'Socata TB10 Tobago', category: 'piston' },
  { code: 'TBM9', label: 'Daher TBM 930', category: 'turboprop' },
  { code: 'PC12', label: 'Pilatus PC-12', category: 'turboprop' },
  { code: 'BE20', label: 'Beechcraft King Air 200', category: 'turboprop' },
  { code: 'BE9L', label: 'Beechcraft King Air 90', category: 'turboprop' },

  // Business jets
  { code: 'C25A', label: 'Cessna Citation CJ2', category: 'bizjet' },
  { code: 'C25B', label: 'Cessna Citation CJ3', category: 'bizjet' },
  { code: 'C25C', label: 'Cessna Citation CJ4', category: 'bizjet' },
  { code: 'C56X', label: 'Cessna Citation Excel/XLS', category: 'bizjet' },
  { code: 'C680', label: 'Cessna Citation Sovereign', category: 'bizjet' },
  { code: 'C750', label: 'Cessna Citation X', category: 'bizjet' },
  { code: 'E50P', label: 'Embraer Phenom 100', category: 'bizjet' },
  { code: 'E55P', label: 'Embraer Phenom 300', category: 'bizjet' },
  { code: 'E545', label: 'Embraer Legacy 450', category: 'bizjet' },
  { code: 'E550', label: 'Embraer Legacy 500', category: 'bizjet' },
  { code: 'LJ45', label: 'Learjet 45', category: 'bizjet' },
  { code: 'LJ75', label: 'Learjet 75', category: 'bizjet' },
  { code: 'CL30', label: 'Bombardier Challenger 300', category: 'bizjet' },
  { code: 'CL35', label: 'Bombardier Challenger 350', category: 'bizjet' },
  { code: 'CL60', label: 'Bombardier Challenger 600/604/605', category: 'bizjet' },
  { code: 'GLEX', label: 'Bombardier Global Express', category: 'bizjet' },
  { code: 'GL6T', label: 'Bombardier Global 6000', category: 'bizjet' },
  { code: 'GL7T', label: 'Bombardier Global 7500', category: 'bizjet' },
  { code: 'G150', label: 'Gulfstream G150', category: 'bizjet' },
  { code: 'G280', label: 'Gulfstream G280', category: 'bizjet' },
  { code: 'GLF4', label: 'Gulfstream IV', category: 'bizjet' },
  { code: 'GLF5', label: 'Gulfstream V', category: 'bizjet' },
  { code: 'G550', label: 'Gulfstream G550', category: 'bizjet' },
  { code: 'G650', label: 'Gulfstream G650', category: 'bizjet' },
  { code: 'FA7X', label: 'Dassault Falcon 7X', category: 'bizjet' },
  { code: 'FA8X', label: 'Dassault Falcon 8X', category: 'bizjet' },
  { code: 'F2TH', label: 'Dassault Falcon 2000', category: 'bizjet' },

  // Helicopters
  { code: 'R44', label: 'Robinson R44', category: 'helicopter' },
  { code: 'R66', label: 'Robinson R66', category: 'helicopter' },
  { code: 'EC35', label: 'Airbus H135', category: 'helicopter' },
  { code: 'EC45', label: 'Airbus H145', category: 'helicopter' },
  { code: 'AS50', label: 'Airbus H125 (AS350)', category: 'helicopter' },
  { code: 'B06', label: 'Bell 206', category: 'helicopter' },
  { code: 'B407', label: 'Bell 407', category: 'helicopter' },
  { code: 'B429', label: 'Bell 429', category: 'helicopter' },
]

const byCode = new Map(aircraftTypes.map((t) => [t.code, t]))

/**
 * Case- and whitespace-tolerant exact lookup. Deliberately no fuzzy or prefix matching
 * (`B7*` → jet and the like): silently labelling an aircraft as something it isn't would be
 * worse in a logbook than showing nothing, so unrecognised codes fall through to `unknown`.
 */
export function lookupAircraft(code: string): AircraftType | undefined {
  return byCode.get(code.trim().toUpperCase())
}

export function aircraftCategory(code: string): AircraftCategory {
  return lookupAircraft(code)?.category ?? 'unknown'
}

/** Full model name (e.g. `Boeing 737-800`), or `undefined` for a code that isn't in the list. */
export function aircraftLabel(code: string): string | undefined {
  return lookupAircraft(code)?.label
}
