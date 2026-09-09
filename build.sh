


rm -rf build
mkdir -p build


cp index.html build/
cp style.css build/
cp app.js build/
cp icon.png build/


if [ -f "README.md" ]; then
    cp README.md build/
fi


ls -la build/