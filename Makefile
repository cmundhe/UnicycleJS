# Set the source directory
SRC_DIR = public_html/js/vendors/unicycle/

# Create list of modules
MODULES = ${SRC_DIR}globals.js\
	${SRC_DIR}Object.js\
	${SRC_DIR}ViewModel.js\
	${SRC_DIR}ViewModelArray.js\
	${SRC_DIR}View.js\
	${SRC_DIR}unicycle.js
			
# Compress all of the modules into unicycle.js
unicycle.js: ${MODULES}
	cat > $@ $^
