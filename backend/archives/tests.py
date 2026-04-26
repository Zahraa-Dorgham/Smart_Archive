from django.contrib.auth import get_user_model
from django.contrib.auth.models import Group, Permission
from rest_framework import status
from rest_framework.test import APITestCase

User = get_user_model()


class UserManagementApiTests(APITestCase):
    def setUp(self):
        self.admin_group = Group.objects.create(name="Admin")
        self.admin_user = self._create_user(
            username="admin@example.com",
            email="admin@example.com",
            password="StrongPass123!",
            groups=[self.admin_group],
            is_staff=True,
        )
        self.client.force_authenticate(user=self.admin_user)

    def _create_user(self, username, email, password, groups=None, is_staff=False):
        user = User.objects.create_user(
            username=username,
            email=email,
            password=password,
            is_staff=is_staff,
        )
        if groups:
            user.groups.set(groups)
        return user

    def test_initialize_default_roles(self):
        response = self.client.post("/api/roles/initialize_defaults/")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(Group.objects.filter(name="Admin").exists())
        self.assertTrue(Group.objects.filter(name="Archiviste").exists())
        self.assertTrue(Group.objects.filter(name="Responsable").exists())
        self.assertTrue(Group.objects.filter(name="Employe").exists())

    def test_create_user_with_groups_and_direct_permissions(self):
        permission = Permission.objects.filter(content_type__app_label="archives").first()
        archiviste_group = Group.objects.create(name="Archiviste")

        response = self.client.post(
            "/api/users/",
            {
                "username": "alice@example.com",
                "email": "alice@example.com",
                "first_name": "Alice",
                "last_name": "Martin",
                "password": "StrongPass123!",
                "groups": [archiviste_group.id],
                "user_permissions": [permission.id] if permission else [],
                "is_active": True,
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        detail_response = self.client.get(f"/api/users/{response.data['id']}/")
        self.assertEqual(detail_response.status_code, status.HTTP_200_OK)
        self.assertEqual(detail_response.data["primary_role"], "Archiviste")
        self.assertEqual(detail_response.data["email"], "alice@example.com")

        if permission:
            returned_permission_ids = [item["id"] for item in detail_response.data["direct_permissions"]]
            self.assertIn(permission.id, returned_permission_ids)

    def test_login_accepts_email_identifier(self):
        user = self._create_user(
            username="admin-login",
            email="login-admin@example.com",
            password="StrongPass123!",
            groups=[self.admin_group],
            is_staff=True,
        )

        response = self.client.post(
            "/api/auth/login/",
            {
                "username": "login-admin@example.com",
                "password": "StrongPass123!",
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["user"]["id"], user.id)
        self.assertEqual(response.data["user"]["email"], "login-admin@example.com")
