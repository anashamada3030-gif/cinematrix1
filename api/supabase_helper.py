#!/usr/bin/env python3
"""
Supabase API Helper Module
Handles data operations with Supabase
"""

import os
import json
from typing import Dict, List, Any
from supabase import create_client, Client

class SupabaseHelper:
    def __init__(self):
        self.url = os.environ.get("SUPABASE_URL")
        self.key = os.environ.get("SUPABASE_KEY")
        
        if not self.url or not self.key:
            raise ValueError("Missing SUPABASE_URL or SUPABASE_KEY environment variables")
        
        self.client: Client = create_client(self.url, self.key)
    
    def insert_bulk(self, table: str, data: List[Dict[str, Any]], batch_size: int = 100) -> Dict[str, Any]:
        """Insert multiple rows in batches"""
        if not data:
            return {"status": "error", "message": "No data to insert"}
        
        inserted = 0
        errors = []
        
        for i in range(0, len(data), batch_size):
            batch = data[i:i+batch_size]
            try:
                response = self.client.table(table).insert(batch).execute()
                inserted += len(batch)
            except Exception as e:
                errors.append(str(e))
        
        return {
            "status": "success" if not errors else "partial",
            "inserted": inserted,
            "total": len(data),
            "errors": errors
        }
    
    def update_or_insert(self, table: str, data: List[Dict[str, Any]], upsert_keys: List[str]) -> Dict[str, Any]:
        """Update if exists, insert if not (upsert)"""
        try:
            response = self.client.table(table).upsert(
                data,
                returning="minimal"
            ).execute()
            return {"status": "success", "count": len(data)}
        except Exception as e:
            return {"status": "error", "message": str(e)}
    
    def get_table_data(self, table: str, limit: int = None) -> List[Dict[str, Any]]:
        """Fetch all rows from a table"""
        try:
            query = self.client.table(table).select("*")
            if limit:
                query = query.limit(limit)
            response = query.execute()
            return response.data or []
        except Exception as e:
            print(f"Error fetching {table}: {e}")
            return []
    
    def delete_table_data(self, table: str, condition: Dict[str, Any] = None) -> Dict[str, Any]:
        """Delete rows from a table (use with caution)"""
        try:
            query = self.client.table(table).delete()
            
            if condition:
                for key, value in condition.items():
                    query = query.eq(key, value)
            else:
                # Delete all if no condition (dangerous!)
                query = query.neq('id', None)  # This still requires caution
            
            response = query.execute()
            return {"status": "success", "deleted": True}
        except Exception as e:
            return {"status": "error", "message": str(e)}
    
    def export_table_to_json(self, table: str, output_file: str = None) -> str:
        """Export table data to JSON"""
        data = self.get_table_data(table)
        
        if output_file:
            with open(output_file, 'w', encoding='utf-8') as f:
                json.dump(data, f, ensure_ascii=False, indent=2)
            return f"Exported {len(data)} rows to {output_file}"
        
        return json.dumps(data, ensure_ascii=False, indent=2)

# Example usage for Vercel serverless function
def handler(request):
    """Example API endpoint for data operations"""
    import json
    
    try:
        helper = SupabaseHelper()
        action = request.args.get("action", "get")
        table = request.args.get("table", "")
        
        if not table:
            return {
                "statusCode": 400,
                "headers": {"Content-Type": "application/json"},
                "body": json.dumps({"error": "Missing 'table' parameter"})
            }
        
        if action == "get":
            data = helper.get_table_data(table, limit=100)
            return {
                "statusCode": 200,
                "headers": {"Content-Type": "application/json"},
                "body": json.dumps({"count": len(data), "data": data})
            }
        
        elif action == "export":
            json_data = helper.export_table_to_json(table)
            return {
                "statusCode": 200,
                "headers": {"Content-Type": "application/json"},
                "body": json_data
            }
        
        else:
            return {
                "statusCode": 400,
                "headers": {"Content-Type": "application/json"},
                "body": json.dumps({"error": f"Unknown action: {action}"})
            }
    
    except Exception as e:
        return {
            "statusCode": 500,
            "headers": {"Content-Type": "application/json"},
            "body": json.dumps({"error": str(e)})
        }
