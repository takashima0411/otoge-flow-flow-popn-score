server {
    listen 80;
    server_name otoge-flow-flow.com;

    location ^~ /.well-known {
        root /usr/share/nginx/html/ssl-proof;
    }

    if ($host = otoge-flow-flow.com) {
        return 301 https://$host$request_uri;
    }    

    return 444;
}

server {
    listen                    443 ssl http2;
    listen                    [::]:443 ssl http2;
    server_name               otoge-flow-flow.com;
    ssl_certificate           /etc/letsencrypt/live/otoge-flow-flow.com/fullchain.pem;
    ssl_certificate_key       /etc/letsencrypt/live/otoge-flow-flow.com/privkey.pem;

    # ssl_certificate           /etc/letsencrypt/live/otoge-flow-flow.com/nginx-certificate.crt;
    # ssl_certificate_key       /etc/letsencrypt/live/otoge-flow-flow.com/nginx.key;
 
    # ssl_certificate           /etc/ssl/certs/testCert.crt;
    # ssl_certificate_key       /etc/ssl/certs/testCert.key;
    ssl_session_timeout       1d;
    ssl_protocols             TLSv1.2 TLSv1.3;
    ssl_prefer_server_ciphers off;
    ssl_ciphers               ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384:ECDHE-ECDSA-CHACHA20-POLY1305:ECDHE-RSA-CHACHA20-POLY1305:DHE-RSA-AES128-GCM-SHA256:DHE-RSA-AES256-GCM-SHA384;
    ssl_session_cache         shared:SSL:10m;
    ssl_session_tickets       off;
    ssl_stapling              off;

    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;

    location ^~ /.well-known {
        root /usr/share/nginx/html/ssl-proof;
    }

    location / {
        proxy_pass http://pst2-app;
        proxy_http_version 1.1;
        proxy_set_header Connection keep-alive;
        proxy_set_header Upgrade $http_upgrade;
        # �N���C�A���gIP�]��
        proxy_set_header X-Real-IP $remote_addr; 
        # �v���g�R���ݒ�]��
        # proxy_set_header X-Forwarded-Proto https;
        proxy_set_header X-Forwarded-Proto $scheme;
        # �T�[�o�[����URI�]��
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        # �T�[�o�[�̃z�X�g���]��
        # proxy_set_header Host $http_host;
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;

        #proxy_set_header   Host $host;
        #proxy_set_header   X-Forwarded-Proto $scheme;


        limit_req  zone=one burst=50 nodelay;
    }
}
