"""
URL configuration for myapp project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/6.0/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('static/blog/', (path('blog/', include('blog.urls'))))
"""
from django.contrib import admin
from django.urls import path, include, re_path
from django.views.static import serve
from django.conf import settings
from archives.spa_views import serve_spa_file

urlpatterns = [
    path('api/', include('archives.urls')),
    path('admin/', admin.site.urls),
    
    # Serve Angular app - must be last to catch-all
    # This serves the built Angular app or falls back to index.html for SPA routing
    path('', serve_spa_file, name='spa-index'),
    re_path(r'^(?!api|admin).*/$', serve_spa_file, name='spa-routes'),
]

# Serve static files in development
if settings.DEBUG:
    import os
    from django.views.static import serve
    from django.conf.urls.static import static
    
    frontend_build_path = os.path.join(settings.BASE_DIR, '../frontend/dist/frontend/browser')
    
    urlpatterns += [
        re_path(r'^(?P<path>.*\.js|.*\.css|.*\.html|.*\.ico|.*\.png|.*\.jpg|.*\.svg|.*\.woff|.*\.woff2)$',
                serve,
                {'document_root': frontend_build_path}),
    ]
