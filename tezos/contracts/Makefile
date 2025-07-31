LIGO_VERSION = 1.10.0
LIGO_COMPILER = docker run --rm -v "${PWD}":"${PWD}" -w "${PWD}" ligolang/ligo:${LIGO_VERSION}
OUTPUT_FOLDER = _compiled

compile:
	rm -r -f ./${OUTPUT_FOLDER} 
	mkdir ./${OUTPUT_FOLDER}
	${LIGO_COMPILER} compile contract escrow_src.mligo -o ${OUTPUT_FOLDER}/escrow_src.tz
	${LIGO_COMPILER} compile contract escrow_factory.mligo -o ${OUTPUT_FOLDER}/escrow_factory.tz

compile_local:
	rm -r -f ./${OUTPUT_FOLDER} 
	mkdir ./${OUTPUT_FOLDER}
	ligo compile contract escrow_src.mligo -o ${OUTPUT_FOLDER}/escrow_src.tz
	ligo compile contract escrow_factory.mligo -o ${OUTPUT_FOLDER}/escrow_factory.tz
