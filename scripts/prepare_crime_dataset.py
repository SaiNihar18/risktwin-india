#!/usr/bin/env python3
from __future__ import annotations

import csv
from pathlib import Path

SOURCE = Path('/home/codespace/.cache/kagglehub/datasets/nilesh2042/stateut-wiseipc-crimes-from-2020-to-2022/versions/1/NCRB_Table_1A.1.csv')
TARGET = Path('/workspaces/risktwin-india/public/data/ncrb_state_crime_rates.csv')


def parse_float(value: str) -> float:
    cleaned = (value or '').strip().replace(',', '')
    return float(cleaned)


def main() -> None:
    if not SOURCE.exists():
        raise SystemExit(f'Source file not found: {SOURCE}')

    with SOURCE.open(newline='', encoding='utf-8') as src:
        reader = csv.DictReader(src)
        rows = list(reader)

    out_rows: list[dict[str, str]] = []
    for row in rows:
        state = (row.get('State/UT') or '').strip()
        if not state:
            continue

        # Keep one comparable baseline year from this interim dataset.
        rate_2022 = parse_float(row.get('Rate of Cognizable Crimes (IPC) (2022)') or '0')
        out_rows.append(
            {
                'state': state,
                'district': '',
                'year': '2022',
                'crime_rate_per_100k': f'{rate_2022:.1f}',
            }
        )

    out_rows.sort(key=lambda r: r['state'])

    TARGET.parent.mkdir(parents=True, exist_ok=True)
    with TARGET.open('w', newline='', encoding='utf-8') as dst:
        writer = csv.DictWriter(dst, fieldnames=['state', 'district', 'year', 'crime_rate_per_100k'])
        writer.writeheader()
        writer.writerows(out_rows)

    print(f'Wrote {len(out_rows)} rows to {TARGET}')


if __name__ == '__main__':
    main()
