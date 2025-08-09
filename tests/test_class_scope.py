import os
import pytest
import requests

BACKEND_URL = os.environ.get("BACKEND_URL")

pytestmark = pytest.mark.skipif(
    not BACKEND_URL, reason="Set BACKEND_URL to run integration tests"
)


def register_user(name, email, password, role, class_name):
    resp = requests.post(
        f"{BACKEND_URL}/auth/register",
        json={
            "name": name,
            "email": email,
            "password": password,
            "role": role,
            "class_name": class_name,
        },
    )
    resp.raise_for_status()
    return resp.json()["token"], resp.json()["user"]


def auth_headers(token):
    return {"Authorization": f"Bearer {token}"}


def test_join_crew_same_class_pass(monkeypatch):
    import uuid

    class_name = f"ClassA-{uuid.uuid4().hex[:6]}"
    teacher_token, teacher = register_user(
        "Teacher A", f"teacherA.{uuid.uuid4().hex[:6]}@x.com", "Pass123!", "teacher", class_name
    )
    student_token, student = register_user(
        "Student A", f"studentA.{uuid.uuid4().hex[:6]}@x.com", "Pass123!", "student", class_name
    )

    # Teacher creates a crew
    create = requests.post(
        f"{BACKEND_URL}/crews/create",
        headers=auth_headers(teacher_token),
        json={"name": "Crew One"},
    )
    create.raise_for_status()
    crew_id = create.json()["crew_id"]

    # Student joins same-class crew
    join = requests.post(
        f"{BACKEND_URL}/crews/join",
        headers=auth_headers(student_token),
        json={"crew_id": crew_id},
    )
    assert join.status_code == 200


def test_join_crew_cross_class_forbidden():
    import uuid

    class_a = f"ClassA-{uuid.uuid4().hex[:6]}"
    class_b = f"ClassB-{uuid.uuid4().hex[:6]}"
    teacher_token, _ = register_user(
        "Teacher A", f"teacherA.{uuid.uuid4().hex[:6]}@x.com", "Pass123!", "teacher", class_a
    )
    student_token, _ = register_user(
        "Student B", f"studentB.{uuid.uuid4().hex[:6]}@x.com", "Pass123!", "student", class_b
    )

    # Crew in Class A
    create = requests.post(
        f"{BACKEND_URL}/crews/create",
        headers=auth_headers(teacher_token),
        json={"name": "Crew A"},
    )
    create.raise_for_status()
    crew_id = create.json()["crew_id"]

    # Student from Class B attempts to join
    join = requests.post(
        f"{BACKEND_URL}/crews/join",
        headers=auth_headers(student_token),
        json={"crew_id": crew_id},
    )
    assert join.status_code == 403


def test_complete_quest_cross_class_forbidden():
    import uuid
    from datetime import date, timedelta

    class_a = f"ClassA-{uuid.uuid4().hex[:6]}"
    class_b = f"ClassB-{uuid.uuid4().hex[:6]}"
    teacher_token, _ = register_user(
        "Teacher A", f"teacherA.{uuid.uuid4().hex[:6]}@x.com", "Pass123!", "teacher", class_a
    )
    student_token, _ = register_user(
        "Student B", f"studentB.{uuid.uuid4().hex[:6]}@x.com", "Pass123!", "student", class_b
    )

    # Teacher in Class A creates a quest
    quest = {
        "title": "Read",
        "description": "Read",
        "start_date": date.today().isoformat(),
        "end_date": (date.today() + timedelta(days=7)).isoformat(),
        "xp_reward": 5,
    }
    create = requests.post(
        f"{BACKEND_URL}/quests",
        headers=auth_headers(teacher_token),
        json=quest,
    )
    create.raise_for_status()
    quest_id = create.json()["id"]

    # Student from different class attempts to complete
    complete = requests.post(
        f"{BACKEND_URL}/quests/{quest_id}/complete",
        headers=auth_headers(student_token),
    )
    assert complete.status_code == 403


