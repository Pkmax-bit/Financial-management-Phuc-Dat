"""
Script to check messages in a conversation and compare with API response
Usage: python scripts/check_conversation_messages.py <conversation_id>
"""

import sys
import os
from pathlib import Path

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from services.supabase_client import get_supabase_client

def check_conversation_messages(conversation_id: str):
    """Check messages in database for a conversation"""
    supabase = get_supabase_client()
    
    print(f"\n{'='*60}")
    print(f"Checking Conversation: {conversation_id}")
    print(f"{'='*60}\n")
    
    # 1. Check conversation exists
    print("1. Checking conversation...")
    conv_result = supabase.table("internal_conversations").select("*").eq("id", conversation_id).single().execute()
    
    if not conv_result.data:
        print(f"❌ Conversation {conversation_id} not found!")
        return
    
    conv = conv_result.data
    print(f"✅ Conversation found:")
    print(f"   - Name: {conv.get('name', 'N/A')}")
    print(f"   - Type: {conv.get('type', 'N/A')}")
    print(f"   - Last message at: {conv.get('last_message_at', 'None')}")
    print(f"   - Last preview: {conv.get('last_message_preview', 'None')}")
    
    # 2. Check participants
    print(f"\n2. Checking participants...")
    participants_result = supabase.table("internal_conversation_participants").select("*").eq("conversation_id", conversation_id).execute()
    participants = participants_result.data or []
    print(f"✅ Found {len(participants)} participants:")
    for p in participants:
        print(f"   - {p.get('user_name', 'Unknown')} ({p.get('user_id', 'N/A')}) - Role: {p.get('role', 'N/A')}")
    
    # 3. Check messages count
    print(f"\n3. Checking messages count...")
    count_result = supabase.table("internal_messages").select("id", count="exact").eq("conversation_id", conversation_id).eq("is_deleted", False).execute()
    total_messages = count_result.count or 0
    print(f"✅ Total messages (not deleted): {total_messages}")
    
    # 4. Check deleted messages
    deleted_count_result = supabase.table("internal_messages").select("id", count="exact").eq("conversation_id", conversation_id).eq("is_deleted", True).execute()
    deleted_messages = deleted_count_result.count or 0
    print(f"   - Deleted messages: {deleted_messages}")
    
    # 5. Get sample messages
    if total_messages > 0:
        print(f"\n4. Sample messages (first 5):")
        messages_result = supabase.table("internal_messages").select("*").eq("conversation_id", conversation_id).eq("is_deleted", False).order("created_at", desc=False).limit(5).execute()
        
        for i, msg in enumerate(messages_result.data or [], 1):
            print(f"\n   Message {i}:")
            print(f"   - ID: {msg.get('id', 'N/A')}")
            print(f"   - Sender ID: {msg.get('sender_id', 'N/A')}")
            print(f"   - Text: {msg.get('message_text', 'N/A')[:50]}...")
            print(f"   - Type: {msg.get('message_type', 'N/A')}")
            print(f"   - Created: {msg.get('created_at', 'N/A')}")
            print(f"   - Reply to: {msg.get('reply_to_id', 'None')}")
            print(f"   - File: {msg.get('file_url', 'None')}")
    else:
        print(f"\n4. No messages found in database")
        print(f"   This is expected for a new conversation")
    
    # 6. Check sender names
    if total_messages > 0:
        print(f"\n5. Checking sender names...")
        messages_result = supabase.table("internal_messages").select("sender_id").eq("conversation_id", conversation_id).eq("is_deleted", False).execute()
        sender_ids = list(set([m["sender_id"] for m in messages_result.data or [] if m.get("sender_id")]))
        
        if sender_ids:
            users_result = supabase.table("users").select("id, full_name").in_("id", sender_ids).execute()
            user_map = {user["id"]: user.get("full_name") for user in users_result.data or []}
            
            print(f"✅ Sender names:")
            for sender_id in sender_ids:
                name = user_map.get(sender_id, "❌ NOT FOUND in users table")
                print(f"   - {sender_id}: {name}")
    
    # 7. Summary
    print(f"\n{'='*60}")
    print(f"SUMMARY")
    print(f"{'='*60}")
    print(f"Conversation: {conv.get('name', 'N/A')} ({conv.get('type', 'N/A')})")
    print(f"Participants: {len(participants)}")
    print(f"Total messages: {total_messages}")
    print(f"Deleted messages: {deleted_messages}")
    print(f"Last message: {conv.get('last_message_at', 'None')}")
    
    if total_messages == 0:
        print(f"\n⚠️  This conversation has no messages yet.")
        print(f"   This is normal for a newly created conversation.")
        print(f"   API will return: {{ messages: [], total: 0, has_more: false }}")
    else:
        print(f"\n✅ Conversation has {total_messages} messages")
        print(f"   API should return all messages with pagination")
    
    print(f"\n{'='*60}\n")

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python scripts/check_conversation_messages.py <conversation_id>")
        print("\nExample:")
        print("  python scripts/check_conversation_messages.py 7234642a-a1c3-4936-842a-8f967197345e")
        sys.exit(1)
    
    conversation_id = sys.argv[1]
    check_conversation_messages(conversation_id)

