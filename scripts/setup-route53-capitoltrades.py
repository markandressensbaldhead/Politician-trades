#!/usr/bin/env python3
"""Update Route 53 for capitoltrades.com → Vercel (politician-trades project)."""

from __future__ import annotations

import os
import sys

try:
    import boto3
    from botocore.exceptions import ClientError
except ImportError:
    print("Installing boto3...")
    import subprocess

    subprocess.check_call(
        [sys.executable, "-m", "pip", "install", "boto3", "-q"]
    )
    import boto3
    from botocore.exceptions import ClientError

DOMAIN = os.environ.get("CAPITOLTRADES_DOMAIN", "capitoltrades.com")
WWW = f"www.{DOMAIN}"
VERCEL_APEX = "76.76.21.21"
VERCEL_CNAME = "cname.vercel-dns.com"
TXT_RECORDS = [
    "vc-domain-verify=capitoltrades.com,3a885a0c5d3909e3a999",
    "vc-domain-verify=www.capitoltrades.com,8deadbf0203963e347af",
]


def require_aws() -> boto3.client:
    if not os.environ.get("AWS_ACCESS_KEY_ID") or not os.environ.get(
        "AWS_SECRET_ACCESS_KEY"
    ):
        print(
            "Missing AWS credentials.\n"
            "Set AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY, then rerun:\n"
            "  python3 scripts/setup-route53-capitoltrades.py"
        )
        sys.exit(1)
    return boto3.client("route53")


def find_zone(client) -> str:
    paginator = client.get_paginator("list_hosted_zones")
    for page in paginator.paginate():
        for zone in page["HostedZones"]:
            name = zone["Name"].rstrip(".")
            if name == DOMAIN:
                return zone["Id"].split("/")[-1]
    print(f"No Route 53 hosted zone found for {DOMAIN}")
    sys.exit(1)


def upsert(client, zone_id: str, name: str, rtype: str, values: list[str], ttl: int = 300):
    client.change_resource_record_sets(
        HostedZoneId=zone_id,
        ChangeBatch={
            "Comment": "Capitol Trades → Vercel",
            "Changes": [
                {
                    "Action": "UPSERT",
                    "ResourceRecordSet": {
                        "Name": name,
                        "Type": rtype,
                        "TTL": ttl,
                        "ResourceRecords": [{"Value": v} for v in values],
                    },
                }
            ],
        },
    )
    print(f"  UPSERT {rtype} {name} → {', '.join(values)}")


def delete_cloudfront_a_records(client, zone_id: str):
    """Remove apex A records that still point at CloudFront."""
    response = client.list_resource_record_sets(
        HostedZoneId=zone_id,
        StartRecordName=DOMAIN,
        StartRecordType="A",
        MaxItems="10",
    )
    changes = []
    for record in response.get("ResourceRecordSets", []):
        if record["Name"].rstrip(".") != DOMAIN or record["Type"] != "A":
            continue
        values = [r["Value"] for r in record.get("ResourceRecords", [])]
        if any(v.startswith("13.225.196.") for v in values) or any(
            v.startswith("3.169.183.") for v in values
        ):
            changes.append({"Action": "DELETE", "ResourceRecordSet": record})
            print(f"  DELETE old A {DOMAIN} → {', '.join(values)}")

    if changes:
        client.change_resource_record_sets(
            HostedZoneId=zone_id,
            ChangeBatch={"Comment": "Remove CloudFront apex records", "Changes": changes},
        )


def main() -> None:
    print(f"Configuring Route 53 for {DOMAIN}...")
    client = require_aws()
    zone_id = find_zone(client)
    print(f"Hosted zone: {zone_id}")

    delete_cloudfront_a_records(client, zone_id)
    upsert(client, zone_id, DOMAIN, "A", [VERCEL_APEX])
    upsert(client, zone_id, WWW, "CNAME", [VERCEL_CNAME])
    upsert(
        client,
        zone_id,
        f"_vercel.{DOMAIN}",
        "TXT",
        [f'"{value}"' for value in TXT_RECORDS],
    )

    print("\nDone. DNS may take 5–30 minutes to propagate.")
    print("Then run domain verification on Vercel.")


if __name__ == "__main__":
    try:
        main()
    except ClientError as error:
        print(f"AWS error: {error}", file=sys.stderr)
        sys.exit(1)
