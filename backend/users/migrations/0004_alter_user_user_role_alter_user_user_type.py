# Generated by Django 5.1.6 on 2025-03-12 19:55

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("users", "0003_alter_user_options_user_date_joined_user_user_type_and_more"),
    ]

    operations = [
        migrations.AlterField(
            model_name="user",
            name="user_role",
            field=models.CharField(
                choices=[
                    ("normal", "Normal User"),
                    ("coordinator", "Event Coordinator"),
                    ("admin", "Admin"),
                ],
                default="user",
                max_length=20,
            ),
        ),
        migrations.AlterField(
            model_name="user",
            name="user_type",
            field=models.CharField(
                choices=[
                    ("normal", "Normal User"),
                    ("coordinator", "Event Coordinator"),
                    ("admin", "Admin"),
                ],
                default="user",
                max_length=20,
            ),
        ),
    ]
