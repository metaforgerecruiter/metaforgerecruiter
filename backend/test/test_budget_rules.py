import re

def parse_test_budget(b_text: str):
    lower = b_text.lower().strip()
    clean = re.sub(r"(?<=\d),(?=\d)", "", b_text)

    # Detect currency
    currency = "INR"
    if re.search(r"(?:usd|\$)", lower):
        currency = "USD"
    elif re.search(r"(?:eur|€)", lower):
        currency = "EUR"
    elif re.search(r"(?:gbp|£)", lower):
        currency = "GBP"

    # Detect period
    is_monthly = bool(re.search(r"\b(?:per\s+month|/month|/m\b|p\.?m\.?|monthly|bill\s+rate|rate\s*/\s*pm|tpc\s+rates?)\b", lower))
    is_yearly = bool(re.search(r"\b(?:per\s+annum|/annum|p\.?a\.?|annually|yearly|lpa)\b", lower))
    is_hourly = bool(re.search(r"\b(?:per\s+hour|/hour|/hr\b|hourly)\b", lower))

    # Match range with possible units on both sides: e.g. 90-1L, 90k-100k, 8-10 LPA, 80,000 - 1,00,000
    m_range = re.search(
        r"(\d+(?:\.\d+)?)\s*(k|l|lakhs?|lpa|lpm)?\s*(?:-|to|–|—)\s*(\d+(?:\.\d+)?)\s*(k|l|lakhs?|lpa|lpm)?",
        clean,
        re.I
    )

    m_single = re.search(r"(\d+(?:\.\d+)?)\s*(k|l|lakhs?|lpa|lpm)?", clean, re.I)

    res = {
        "min": 0, "max": 0, "currency": currency,
        "period": "yearly" if is_yearly else ("monthly" if is_monthly else ("hourly" if is_hourly else "yearly")),
        "budget_text": b_text
    }

    if m_range:
        v1_raw, u1, v2_raw, u2 = float(m_range.group(1)), (m_range.group(2) or "").lower(), float(m_range.group(3)), (m_range.group(4) or "").lower()
        # Handle asymmetric units like "90-1L" or "80k-1L"
        if not u1 and ("l" in u2 or "lakh" in u2) and v1_raw > 10 and v2_raw <= 10:
            v1 = v1_raw * 1000
            v2 = v2_raw * 100000
        elif ("k" in u1) and ("l" in u2 or "lakh" in u2):
            v1 = v1_raw * 1000
            v2 = v2_raw * 100000
        else:
            unit = u2 or u1
            def apply_unit(v):
                if "l" in unit or "lakh" in unit:
                    return v * 100000
                elif "k" in unit:
                    return v * 1000
                elif v < 100 and (is_yearly or "lpa" in lower):
                    return v * 100000
                return v
            v1 = apply_unit(v1_raw)
            v2 = apply_unit(v2_raw)

        res["min"] = min(v1, v2)
        res["max"] = max(v1, v2)

    elif m_single:
        v_raw = float(m_single.group(1))
        u = (m_single.group(2) or "").lower()
        if "l" in u or "lakh" in u:
            v = v_raw * 100000
        elif "k" in u:
            v = v_raw * 1000
        elif v_raw < 100 and (is_yearly or "lpa" in lower):
            v = v_raw * 100000
        elif v_raw < 100 and is_monthly:
            v = v_raw * 100000
        else:
            v = v_raw
        res["min"] = v
        res["max"] = v

    return res

test_cases = [
    "Bill Rate per month for TPC: 90-1L / M",
    "TPC Rates - 130000",
    "Rate per month for TPC (in terms of INR)- 2.5L",
    "8-10 LPA",
    "18 LPA",
    "1.80 Lakhs",
    "2.10 Lakhs",
    "Rs. 720000",
    "$60 - $70 / hr",
    "260000 to 280000/month"
]

for tc in test_cases:
    r = parse_test_budget(tc)
    print(f"'{tc}' => min: {r['min']}, max: {r['max']}, curr: {r['currency']}, period: {r['period']}")
